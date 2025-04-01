import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import WrapperPlayer from '../app/players/wrapper-player'

describe('WrapperPlayer via wrapper', () => {
    it('renders Youtube thumbnail and player', () => {
        render(<WrapperPlayer link='https://www.youtube.com/watch?v=jfKfPfyJRdk'/>)

        // Vérifier que la miniature est bien affichée avant le survol
        const thumbnail = screen.getByRole('img', { name: /video thumbnail/i })
        expect(thumbnail).toBeInTheDocument()
        expect(thumbnail).toHaveAttribute('src', 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg')

        // Simuler le survol pour afficher le player
        fireEvent.mouseEnter(thumbnail)

        // Vérifier que le player est bien affiché après le survol
        const iframe = screen.getByTitle('youtube-player')
        expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/jfKfPfyJRdk')
    })

    it('renders Twitch thumbnail and player', () => {
        render(<WrapperPlayer link='https://www.twitch.tv/BDECERI'/>)

        // Vérifier la miniature avant le survol
        const thumbnail = screen.getByRole('img', { name: /video thumbnail/i })
        expect(thumbnail).toBeInTheDocument()
        expect(thumbnail).toHaveAttribute('src', 'https://static-cdn.jtvnw.net/previews-ttv/live_user_BDECERI-640x360.jpg')

        // Simuler le survol pour afficher le player
        fireEvent.mouseEnter(thumbnail)

        // Vérifier que le player est bien affiché
        const iframe = screen.getByTitle('twitch-player')
        expect(iframe).toHaveAttribute('src', 'https://player.twitch.tv/?channel=BDECERI&parent=localhost')
    })

    it('renders Dailymotion thumbnail and player', () => {
        render(<WrapperPlayer link='https://www.dailymotion.com/video/x1f6c9'/>)

        // Vérifier la miniature avant le survol
        const thumbnail = screen.getByRole('img', { name: /video thumbnail/i })
        expect(thumbnail).toBeInTheDocument()
        expect(thumbnail).toHaveAttribute('src', 'https://www.dailymotion.com/thumbnail/video/x1f6c9')

        // Simuler le survol pour afficher le player
        fireEvent.mouseEnter(thumbnail)

        // Vérifier que le player est bien affiché
        const iframe = screen.getByTitle('dailymotion-player')
        expect(iframe).toHaveAttribute('src', 'https://geo.dailymotion.com/player.html?video=x1f6c9')
    })

    it('renders error message', () => {
        render(<WrapperPlayer link='https://test.erreur.test'/>)
        const errorMessage = screen.getByText('Impossible d\'extraire l\'ID de la vidéo')
        expect(errorMessage).toBeInTheDocument()
    })
})
