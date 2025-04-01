import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import WrapperPlayer from '../app/players/wrapper-player'

describe ('WrapperPlayer via wrapper', () => {
    it('renders Youtube Player', () => {
        render(<WrapperPlayer link='https://www.youtube.com/watch?v=jfKfPfyJRdk'/>)
        const iframe = screen.getByTitle('youtube-player')

        expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/jfKfPfyJRdk')
        
    })

    it('renders Twitch Player via wrapper', () => {
        render(<WrapperPlayer link='https://www.twitch.tv/BDECERI'/>)
        const iframe = screen.getByTitle('twitch-player')
    
        expect(iframe).toHaveAttribute('src', 'https://player.twitch.tv/?channel=BDECERI&parent=localhost')
        
    })

    it ('renders Dailymotion Player via wrapper', () => {
        render(<WrapperPlayer link='https://www.dailymotion.com/video/x1f6c9'/>)
        const iframe = screen.getByTitle('dailymotion-player')

        expect(iframe).toHaveAttribute('src', 'https://geo.dailymotion.com/player.html?video=x1f6c9')
    })
})
