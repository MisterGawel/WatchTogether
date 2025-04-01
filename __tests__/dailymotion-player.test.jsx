import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import DailymotionPlayer from '../app/players/dailymotion-player'

describe ('DailymotionPlayer', () => {
    it('renders a Dailymotion player', () => {
        render(<DailymotionPlayer videoId='x1f6c9' />)

        const iframe = screen.getByTitle('dailymotion-player')

        expect(iframe).toHaveAttribute('src', 'https://geo.dailymotion.com/player.html?video=x1f6c9')
    })
})
