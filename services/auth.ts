import { auth } from "@/firebaseConfig";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword,
} from "firebase/auth";

export async function resetPassword(email: string) {
  const sanitizedEmail = email.trim();
  if (!sanitizedEmail) {
    throw new Error("Veuillez entrer un email.");
  }

  try {
    const appOptions = auth.app?.options ?? {};
    const authDomain = typeof appOptions.authDomain === "string" ? appOptions.authDomain : undefined;
    const fallbackRedirectUrl = authDomain ? `https://${authDomain}/__/auth/action` : undefined;

    if (fallbackRedirectUrl) {
      await sendPasswordResetEmail(auth, sanitizedEmail, {
        url: fallbackRedirectUrl,
        handleCodeInApp: false,
      });
    } else {
      await sendPasswordResetEmail(auth, sanitizedEmail);
    }
    return "Email envoyé ! Vérifiez votre boîte mail.";
  } catch (error: any) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("resetPassword error", error);
    }
    if (error?.code === "auth/user-not-found") {
      throw new Error("Aucun compte n'existe avec cet email.");
    }
    if (error?.code === "auth/invalid-email") {
      throw new Error("Adresse email invalide.");
    }
    if (error?.code === "auth/missing-continue-uri") {
      throw new Error(
        "URL de redirection manquante. Vérifiez la configuration Firebase Authentication."
      );
    }
    throw new Error(
      "Impossible d'envoyer l'email de réinitialisation. Réessayez plus tard ou contactez le support."
    );
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("Session invalide. Veuillez vous reconnecter.");
  }

  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();

  if (!trimmedCurrent || !trimmedNew) {
    throw new Error("Tous les champs doivent être remplis.");
  }

  if (trimmedNew.length < 6) {
    throw new Error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, trimmedCurrent);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, trimmedNew);
  } catch (error: any) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("changePassword error", error);
    }

    if (error?.code === "auth/wrong-password") {
      throw new Error("Le mot de passe actuel est incorrect.");
    }

    if (error?.code === "auth/too-many-requests") {
      throw new Error("Trop de tentatives. Veuillez réessayer plus tard.");
    }

    if (error?.code === "auth/requires-recent-login") {
      throw new Error("Veuillez vous reconnecter avant de changer votre mot de passe.");
    }

    throw new Error("Impossible de mettre à jour le mot de passe. Réessayez plus tard.");
  }
}
