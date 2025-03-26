"use client";

import { useState } from 'react';

const WrapperPlayer = ({ Player }) => {
    const [videoId, setVideoId] = useState('');

    return (
        <div className='relative w-full h-full'>
            <input
                type='text'
                placeholder='Enter video id'
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
            />

            <Player videoId={videoId} channel={videoId} />
        </div>
    );
};

export default WrapperPlayer;