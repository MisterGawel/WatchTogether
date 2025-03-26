import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import TwitchPlayer from '../app/players/twitch-player'

describe ('TwitchPlayer', () => {
    it('renders a YouTube player', () => {
        render(<TwitchPlayer channel='BDECERI' />)

        const iframe = screen.getByTitle('twitch-player')

        expect(iframe).toHaveAttribute('src', 'https://player.twitch.tv/?channel=BDECERI&parent=localhost')
    })
})
