"use client"  // habilita o modo client-side no Next.js

import Link from "next/link"  // para navegação interna
import Image from "next/image"  // para otimização de imagens
import { Instagram } from "lucide-react"  // ícone do Instagram

// componente de rodapé
export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">  {/* borda superior e fundo cinza claro */}
      <div className="container py-8 md:py-12">  {/* container com padding */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">  {/* grid com 4 colunas no md+ */}
          
          {/* Logo e descrição */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/">  {/* link para a home */}
              <Image
                src="/logo.png?height=60&width=60"
                alt="Logo da Ferrari"  // descrição para acessibilidade
                width={60}
                height={60}
                className="mb-4 cursor-pointer"
              />
            </Link>
            <p className="text-sm text-gray-600">
              A loja oficial de miniaturas Ferrari
            </p>
          </div>

          {/* Links da loja */}
          <div>
            <h3 className="text-lg font-medium">Loja</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/cars" className="text-sm text-gray-600 hover:text-red-600">
                  Miniaturas de Carros
                </Link>
              </li>
              <li>
                <Link href="/formula1" className="text-sm text-gray-600 hover:text-red-600">
                  Miniaturas de Fórmula 1
                </Link>
              </li>
              <li>
                <Link href="/helmets" className="text-sm text-gray-600 hover:text-red-600">
                  Capacetes
                </Link>
              </li>
            </ul>
          </div>

          {/* Links da conta do usuário */}
          <div>
            <h3 className="text-lg font-medium">Conta</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/login" className="text-sm text-gray-600 hover:text-red-600">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-600 hover:text-red-600">
                  Cadastrar
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-red-600">
                  Meu Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações de contato */}
          <div>
            <h3 className="text-lg font-medium">Informações</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-red-600">
                  Contato
                </Link>
              </li>
              <li className="text-sm text-gray-600">
                <span className="block">ferrari.store@gmail.com</span>  {/* e-mail */}
              </li>
              <li className="text-sm text-gray-600">
                <span className="block">(16) 123456789</span>  {/* telefone */}
              </li>
              <li className="mt-2">
                <a
                  href="https://instagram.com"  // link externo
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-red-600"
                >
                  <Instagram className="mr-1 h-4 w-4" />  {/* ícone do Instagram */}
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-red-600">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* direitos autorais */}
        <div className="mt-8 border-t pt-8">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Loja de Miniaturas Ferrari. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
