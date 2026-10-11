// Ícones desenhados para o MacReader (traço de 1,75 px numa grade de 24).

const paths = {
  voltar: 'M15 5l-7 7 7 7',
  sumario: 'M5 7h14M5 12h14M5 17h9',
  marcador: 'M7 4h10v16l-5-4-5 4z',
  marcadorCheio: 'M7 4h10v16l-5-4-5 4z',
  texto: 'M4 18l4.5-12h1L14 18M5.6 14h6.8M15 18l2.75-7h.5L21 18M15.9 15.8h4.2',
  mais: 'M12 5v14M5 12h14',
  fechar: 'M6 6l12 12M18 6L6 18',
  lixeira: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  destaque: 'M4 20h7M14.5 4.5l5 5L10 19H5v-5z',
  nota: 'M5 5h14v10l-4 4H5zM15 19v-4h4',
  esquerda: 'M15 5l-7 7 7 7',
  direita: 'M9 5l7 7-7 7',
  livro: 'M12 7c-2-1.7-4.6-2.4-8-2.4v12.8c3.4 0 6 .7 8 2.4 2-1.7 4.6-2.4 8-2.4V4.6c-3.4 0-6 .7-8 2.4zM12 7v12.8',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const filled = name === 'marcadorCheio'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
