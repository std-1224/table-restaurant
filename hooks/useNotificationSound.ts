import { useCallback, useRef, useEffect } from 'react'
import { useSoundEnabled } from '@/lib/store'

interface NotificationSoundOptions {
  volume?: number
  playbackRate?: number
  loop?: boolean
}

export function useNotificationSound(options: NotificationSoundOptions = {}) {
  const { volume = 0.7, playbackRate = 1.0, loop = false } = options
  const soundEnabled = useSoundEnabled()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)

  // Initialize audio element
  useEffect(() => {
    try {
      audioRef.current = new Audio('/mixkit-happy-bells-notification-937.wav')
      audioRef.current.volume = volume
      audioRef.current.playbackRate = playbackRate
      audioRef.current.loop = loop
      
      // Preload the audio for better performance
      audioRef.current.preload = 'auto'
      
      // Handle audio events
      const audio = audioRef.current
      
      const handleCanPlay = () => {
        console.log('Notification sound loaded and ready to play')
      }
      
      const handleError = (e: Event) => {
        console.error('Error loading notification sound:', e)
      }
      
      const handleEnded = () => {
        isPlayingRef.current = false
      }
      
      const handlePlay = () => {
        isPlayingRef.current = true
      }
      
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('error', handleError)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', handlePlay)
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', handlePlay)
      }
    } catch (error) {
      console.error('Failed to initialize notification sound:', error)
    }
  }, [volume, playbackRate, loop])

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled || !audioRef.current) {
      return false
    }

    try {
      // Reset audio to beginning if it's already playing
      if (isPlayingRef.current) {
        audioRef.current.currentTime = 0
      }

      // Play the sound
      await audioRef.current.play()
      return true
    } catch (error) {
      console.error('Failed to play notification sound:', error)
      return false
    }
  }, [soundEnabled])

  // Stop notification sound
  const stopNotificationSound = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        isPlayingRef.current = false
        console.log('Notification sound stopped')
      } catch (error) {
        console.error('Failed to stop notification sound:', error)
      }
    }
  }, [])

  // Update volume
  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))
    }
  }, [])

  // Check if sound is currently playing
  const isPlaying = useCallback(() => {
    return isPlayingRef.current
  }, [])

  return {
    playNotificationSound,
    stopNotificationSound,
    setVolume,
    isPlaying,
    soundEnabled,
  }
}

// Hook for different types of notification sounds
export function useNotificationSounds() {
  const defaultSound = useNotificationSound({ volume: 0.7 })
  const urgentSound = useNotificationSound({ volume: 0.9 })
  const subtleSound = useNotificationSound({ volume: 0.4 })

  const playNotificationByType = useCallback((type: 'waiter_call' | 'bill_request' | 'special_request' | 'new_order' | 'default') => {
    switch (type) {
      case 'special_request':
        return urgentSound.playNotificationSound()
      case 'waiter_call':
      case 'bill_request':
        return defaultSound.playNotificationSound()
      case 'new_order':
        return subtleSound.playNotificationSound()
      default:
        return defaultSound.playNotificationSound()
    }
  }, [defaultSound, urgentSound, subtleSound])

  return {
    playNotificationByType,
    defaultSound,
    urgentSound,
    subtleSound,
  }
}
