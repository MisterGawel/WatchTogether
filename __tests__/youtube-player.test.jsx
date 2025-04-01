import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import YoutubePlayer from '../app/players/youtube-player'

describe ('YoutubePlayer', () => {
    it('renders a YouTube player', () => {
        render(<YoutubePlayer videoId='jfKfPfyJRdk' />)

        const iframe = screen.getByTitle('youtube-player')

        expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/jfKfPfyJRdk')
    })
})
