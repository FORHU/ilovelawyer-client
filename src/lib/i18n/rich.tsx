import { Fragment, type ReactNode } from "react";

/**
 * A translated sentence with markup inside: rich(t("Code sent to {email}"), { email: <b>{email}</b> }).
 * t() leaves a {name} it isn't given as it is, and this puts the element there, so a translation can
 * move it anywhere in the sentence.
 */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  const pieces = text.split(/\{(\w+)\}/g);
  return pieces.map((piece, i) => (i % 2 === 1 ? <Fragment key={i}>{piece in parts ? parts[piece] : `{${piece}}`}</Fragment> : piece));
}
