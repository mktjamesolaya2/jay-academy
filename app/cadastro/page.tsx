import { SignupForm } from "./signup-form";
import { OrbitIcons } from "@/components/orbit-icons";

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center py-12">
      <OrbitIcons />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-semibold tracking-[-0.04em] leading-none text-white">
            Jay Academy
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Crie sua conta pra começar
          </p>
        </div>

        <div className="bg-[#0f0f0f]/95 backdrop-blur border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl">
          <SignupForm />
        </div>

        <p className="text-center text-[11px] text-neutral-600 mt-8">
          © 2026 Jay Academy. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
