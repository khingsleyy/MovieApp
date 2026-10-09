import React, { useCallback, useEffect, useRef, useState } from 'react'

const Arrow = ({ side, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
        className={`absolute top-0 bottom-0 z-10 w-12 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${side === 'left' ? 'left-0' : 'right-0'}`}
        style={{
            background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(3,0,20,0.85), transparent)`,
        }}
    >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={side === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
        </svg>
    </button>
)

// roomy = fixed-size slots; a hovered card grows inside its slot and the slots after it
// slide aside with transforms (no layout work, so it stays smooth)
const roomyClasses = [
    'pt-4 pb-16',
    '[&>*]:relative',
    '[&>*]:w-[200px]',
    '[&>*]:h-[275px]',
    '[&>*]:transition-transform',
    '[&>*]:duration-300',
    '[&>*]:ease-out',
    '[&>*]:will-change-transform',
    '[&>*:hover]:z-20',
    '[&>*:hover~*]:translate-x-[190px]',
].join(' ')

const Carousel = ({ children, className = '', roomy = false }) => {
    const ref = useRef(null)
    const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false })
    const [canLeft, setCanLeft] = useState(false)
    const [canRight, setCanRight] = useState(false)

    const update = useCallback(() => {
        const el = ref.current
        if (!el) return
        setCanLeft(el.scrollLeft > 4)
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }, [])

    useEffect(() => {
        update()
    }, [children, update])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [update])

    const scrollByPage = (dir) => {
        const el = ref.current
        el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
    }

    const onMouseDown = (e) => {
        drag.current = {
            down: true,
            startX: e.pageX,
            startScroll: ref.current.scrollLeft,
            moved: false,
        }
    }

    const onMouseMove = (e) => {
        const d = drag.current
        if (!d.down) return
        const dx = e.pageX - d.startX
        if (Math.abs(dx) > 5) d.moved = true
        ref.current.scrollLeft = d.startScroll - dx
    }

    const endDrag = () => {
        drag.current.down = false
    }

    // stops a drag from counting as a click on a card
    const onClickCapture = (e) => {
        if (drag.current.moved) {
            e.stopPropagation()
            e.preventDefault()
            drag.current.moved = false
        }
    }

    const spacing = roomy ? roomyClasses : 'py-4'

    return (
        <div className="relative group">
            {canLeft && <Arrow side="left" onClick={() => scrollByPage(-1)} />}
            {canRight && <Arrow side="right" onClick={() => scrollByPage(1)} />}

            <div
                ref={ref}
                onScroll={update}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onClickCapture={onClickCapture}
                onDragStart={(e) => e.preventDefault()}
                className={`flex items-start overflow-x-auto cursor-grab select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${spacing} ${className}`}
            >
                {children}
            </div>
        </div>
    )
}

export default Carousel