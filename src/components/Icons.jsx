const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const make = (children) =>
  function Icon({ size = 20, filled = false, ...rest }) {
    return (
      <svg {...base} width={size} height={size} {...rest} fill={filled ? 'currentColor' : 'none'}>
        {children}
      </svg>
    )
  }

export const Compass = make(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>)
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const Bookmark = make(<path d="M6 4h12v17l-6-4-6 4z" />)
export const BookmarkCheck = make(<><path d="M6 4h12v17l-6-4-6 4z" /><path d="m9.5 10 1.8 1.8L15 8" /></>)
export const User = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>)
export const Shuffle = make(<><path d="M3 7h3c5 0 6 10 11 10h4M3 17h3c1.5 0 2.600-.8 3.600-2M14.400 9C15.300 7.800 16.200 7 17.500 7H21" /><path d="m18 4 3 3-3 3M18 14l3 3-3 3" /></>)
export const Arrow = make(<path d="M7 17 17 7M8 7h9v9" />)
export const ArrowRight = make(<path d="M5 12h14m-6-6 6 6-6 6" />)
export const ArrowLeft = make(<path d="M19 12H5m6-6-6 6 6 6" />)
export const Close = make(<path d="M6 6l12 12M18 6 6 18" />)
export const Eye = make(<><path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>)
export const TextSize = make(<><path d="M3 19 8 6l5 13M5 14h6" /><path d="M15 19l3-8 3 8M16 16.500h4" /></>)
export const Sprout = make(<><path d="M12 21v-9" /><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" /><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z" /></>)
export const Book = make(<><path d="M12 6c-2-1.500-5-2-9-2v14c4 0 7 .5 9 2 2-1.500 5-2 9-2V4c-4 0-7 .5-9 2z" /><path d="M12 6v14" /></>)
export const Cloud = make(<path d="M7 18a4 4 0 0 1-.5-8 5.500 5.500 0 0 1 10.500-1A4.500 4.500 0 0 1 17 18z" />)
export const Play = make(<path d="M8 5v14l11-7z" />)
export const Pause = make(<path d="M8 5v14M16 5v14" />)
export const Stop = make(<rect x="6" y="6" width="12" height="12" rx="1" />)
export const Volume = make(<><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.500 8.500a5 5 0 0 1 0 7M18.500 5.500a9 9 0 0 1 0 13" /></>)
