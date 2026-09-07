import { paraCents } from "@/lib/format";

/** Campo de texto do formulário; devolve `null` quando vazio. */
export function texto(fd: FormData, campo: string): string | null {
  const v = fd.get(campo);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function textoObrigatorio(fd: FormData, campo: string): string {
  const v = texto(fd, campo);
  if (!v) throw new Error(`O campo "${campo}" é obrigatório.`);
  return v;
}

export function inteiro(fd: FormData, campo: string): number | null {
  const v = texto(fd, campo);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function inteiroObrigatorio(fd: FormData, campo: string): number {
  const n = inteiro(fd, campo);
  if (n === null) throw new Error(`O campo "${campo}" é obrigatório.`);
  return n;
}

export function decimal(fd: FormData, campo: string): number {
  const v = texto(fd, campo);
  if (v === null) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function cents(fd: FormData, campo: string): number | null {
  return paraCents(texto(fd, campo));
}

export function booleano(fd: FormData, campo: string): number {
  const v = fd.get(campo);
  return v === "on" || v === "1" || v === "true" ? 1 : 0;
}
