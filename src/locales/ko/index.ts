// The Korean catalog: English key → Korean, one file per area of the app. See lib/i18n/translate.ts.

import common from "./common.json";
import auth from "./auth.json";
import shell from "./shell.json";
import cases from "./cases.json";
import casePage from "./case.json";
import wizard from "./wizard.json";
import documents from "./documents.json";
import gmail from "./gmail.json";
import consent from "./consent.json";
import payment from "./payment.json";
import settings from "./settings.json";
import tour from "./tour.json";
import lawyers from "./lawyers.json";
import story from "./story.json";
import onboarding from "./onboarding.json";
import voice from "./voice.json";
import questions from "./questions.json";
import evidence from "./evidence.json";

export const KO_FILES: Record<string, Record<string, string>> = { common, auth, shell, cases, case: casePage, wizard, documents, gmail, consent, payment, settings, tour, lawyers, story, onboarding, voice, questions, evidence };

export const KO: Record<string, string> = Object.assign({}, ...Object.values(KO_FILES));
