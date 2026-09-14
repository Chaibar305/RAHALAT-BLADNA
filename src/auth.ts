import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/fr/connexion",
    newUser: "/fr/completer-profil",
    error: "/fr/connexion",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "DEMO_GOOGLE_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "DEMO_GOOGLE_CLIENT_SECRET",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          fullName: profile.name,
          email: profile.email,
          image: profile.picture,
          avatarUrl: profile.picture,
          role: "CLIENT",
          isProfileComplete: false,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrPhone: { label: "Email / Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          throw new Error("Veuillez renseigner vos identifiants");
        }

        const identifier = credentials.emailOrPhone.trim();

        // Recherche par email ou par téléphone
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { phone: identifier },
            ],
          },
        });

        if (!user) {
          throw new Error("Aucun compte trouvé avec ces identifiants");
        }

        // Vérification de restriction de compte
        if (user.isBlocked) {
          const reasonMsg = user.blockedReason ? ` (Motif : ${user.blockedReason})` : "";
          throw new Error(`Votre compte a été suspendu par l'administration${reasonMsg}. Contactez le support.`);
        }

        if (!user.passwordHash) {
          throw new Error(
            "Ce compte utilise la connexion Google. Veuillez vous connecter via Google ou définissez un mot de passe depuis votre profil."
          );
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error("Mot de passe incorrect");
        }

        return {
          id: user.id,
          name: user.name || user.fullName,
          fullName: user.fullName || user.name,
          email: user.email,
          image: user.image || user.avatarUrl,
          phone: user.phone,
          cinOrPassport: user.cinOrPassport,
          role: user.role || "CLIENT",
          isProfileComplete: user.isProfileComplete ?? !!(user.phone && user.cinOrPassport),
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        try {
          // Vérifier si un compte existe déjà dans la base
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Bloquer la connexion si l'utilisateur est suspendu
          if (existingUser?.isBlocked) {
            console.warn(`[Auth.js] Tentative de connexion refusée pour compte suspendu: ${user.email}`);
            return false;
          }

          if (existingUser) {
            // Mettre à jour l'avatar et l'état de vérification sans écraser le rôle existant
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                fullName: user.name || existingUser.fullName,
                image: user.image || existingUser.image,
                avatarUrl: user.image || existingUser.avatarUrl,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            });
            // Propager les données existantes
            user.id = updatedUser.id;
            user.role = updatedUser.role || "CLIENT";
            user.phone = updatedUser.phone;
            user.cinOrPassport = updatedUser.cinOrPassport;
            user.isProfileComplete = updatedUser.isProfileComplete;
          } else {
            // Créer le compte utilisateur voyageur standard
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                fullName: user.name || user.email.split("@")[0],
                image: user.image,
                avatarUrl: user.image,
                role: "CLIENT",
                isVerified: true,
                emailVerified: new Date(),
                isProfileComplete: false,
              },
            });
            user.id = newUser.id;
            user.role = "CLIENT";
            user.isProfileComplete = false;
          }
        } catch (error) {
          console.warn("Notice: Prisma auto-sync with Google OAuth profile", error);
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // 1. Initialisation du Token JWT lors de la connexion initiale
      if (user) {
        token.id = user.id;
        token.role = user.role || "CLIENT";
        token.phone = user.phone || null;
        token.cinOrPassport = user.cinOrPassport || null;
        token.isProfileComplete = user.isProfileComplete ?? !!(user.phone && user.cinOrPassport);
      }

      // 2. Mise à jour dynamique de session (via update() côté client)
      if (trigger === "update" && session) {
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.cinOrPassport !== undefined) token.cinOrPassport = session.cinOrPassport;
        if (session.isProfileComplete !== undefined) token.isProfileComplete = session.isProfileComplete;
        if (session.role !== undefined) token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "CLIENT";
        session.user.phone = (token.phone as string) || null;
        session.user.cinOrPassport = (token.cinOrPassport as string) || null;
        session.user.isProfileComplete = (token.isProfileComplete as boolean) || false;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "85i2RnsI5hHS9b0hSllV3rdt/Pwcx6ATi18qdQmEvz4=",
  debug: process.env.NODE_ENV === "development",
};

/**
 * Helper serveur pour récupérer la session utilisateur courante
 */
export async function auth() {
  return await getServerSession(authOptions);
}
