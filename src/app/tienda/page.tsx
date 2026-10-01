import { PackageOpen } from "lucide-react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageHero } from "@/components/layout/PageHero";
import { StoreItemCard } from "@/components/store/StoreItemCard";
import { TokenBalance } from "@/components/store/TokenBalance";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { readAccountState } from "@/lib/energy/server";
import { STORE_ITEMS } from "@/lib/store/catalog";

export const metadata: Metadata = {
  title: "Tienda · BytePath",
  description: "Usa tus tokens para desbloquear cosas para tu camino en BytePath.",
};

/**
 * La tienda de BytePath.
 *
 * Todavía no vende nada: no hay objetos, ni compras, ni inventario. Lo que sí
 * hay es el saldo real (el mismo `get_account_state` que usa la cabecera) y el
 * sitio donde aparecerán los objetos del catálogo (`STORE_ITEMS`).
 *
 * Se puede visitar sin sesión, como el camino de un curso: explica qué es la
 * tienda y pide entrar para ver el saldo. `readAccountState` solo devuelve el
 * estado de quien pide la página —la función de la base de datos usa
 * `auth.uid()`—, así que nadie ve el saldo de otro.
 */
export default async function StorePage() {
  const account = await readAccountState();
  const balance = account.signedIn ? account.tokens : null;

  return (
    <>
      <Navbar />
      <main>
        <PageHero eyebrow="tienda" eyebrowClass="text-brand-300" title="La tienda de BytePath">
          Usa tus tokens para desbloquear cosas para tu camino.
        </PageHero>

        <section className="bg-canvas py-10 sm:py-12">
          <Container width="wide" className="flex flex-col gap-10">
            <TokenBalance initial={account} />

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-semibold">Objetos</h2>
                <p className="text-dense text-fg-muted">Se consiguen con tokens.</p>
              </div>

              {STORE_ITEMS.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {STORE_ITEMS.map((item) => (
                    <StoreItemCard key={item.id} item={item} balance={balance} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center rounded-panel border border-dashed border-line bg-surface-2/50 px-6 py-12 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft">
                    <PackageOpen aria-hidden className="size-7 text-brand-ink" />
                  </span>
                  <Badge tone="soon" className="mt-5">
                    Próximamente
                  </Badge>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                    Aquí aparecerán objetos para tu camino
                  </h3>
                  <p className="mt-2 max-w-md text-dense leading-6 text-fg-muted">
                    Cosas que podrás conseguir con los tokens que ganas completando lecciones. Aún no
                    hay ninguno: cuando llegue el primero, lo verás aquí con su precio en tokens.
                  </p>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
