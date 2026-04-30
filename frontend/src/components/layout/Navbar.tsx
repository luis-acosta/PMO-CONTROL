import Link from "next/link";
import { Wrench } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            PMO CONTROL
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Espacio reservado para acciones futuras en la navbar */}
        </div>
      </div>
    </header>
  );
}
