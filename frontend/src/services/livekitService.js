import { Room, RoomEvent } from 'livekit-client';

let room = null;

export async function getLiveKitToken(roomName, identity) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const res = await fetch(`${backendUrl}/api/livekit/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: roomName, identity }),
  });
  if (!res.ok) throw new Error('Khong the lay LiveKit token');
  return res.json();
}

export async function connectToRoom(roomName, identity, callbacks) {
  const { token, url: backendUrl } = await getLiveKitToken(roomName, identity);

  // Use REACT_APP_LIVEKIT_URL from frontend .env (if set), fallback to backend URL
  const livekitUrl = process.env.REACT_APP_LIVEKIT_URL || backendUrl;

  room = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: { resolution: { width: 640, height: 480 } },
  });

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === 'video') {
      const stream = new MediaStream([track.mediaStreamTrack]);
      const sid = participant.sid;
      const displayName = participant.name || participant.identity || 'Hoc vien';
      callbacks.onTrackSubscribed?.(sid, stream, displayName);
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    if (track.kind === 'video') {
      callbacks.onTrackUnsubscribed?.(participant.sid);
    }
  });

  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('LiveKit participant connected:', participant.identity, participant.sid);
    callbacks.onParticipantConnected?.(participant.sid, participant.name || participant.identity || 'Hoc vien');
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    callbacks.onParticipantDisconnected?.(participant.sid);
  });

  room.on(RoomEvent.Disconnected, () => {
    callbacks.onDisconnected?.();
  });

  await room.connect(livekitUrl, token);
  return room;
}

export async function publishLocalVideo(mediaStream) {
  if (!room) return;
  // Huy track cu neu co
  const oldPub = room.localParticipant.getTrackPublication('camera');
  if (oldPub) await oldPub.unpublish();

  const videoTrack = mediaStream.getVideoTracks()[0];
  if (!videoTrack) return;
  await room.localParticipant.publishTrack(videoTrack, {
    source: 1,
    name: 'camera',
  });

  // Publish audio track tu webcam
  const audioTrack = mediaStream.getAudioTracks()[0];
  if (audioTrack) {
    const oldAudioPub = room.localParticipant.getTrackPublication('microphone');
    if (oldAudioPub) await oldAudioPub.unpublish();
    await room.localParticipant.publishTrack(audioTrack, {
      source: 2,
      name: 'microphone',
    });
  }
}

export function setAudioEnabled(enabled) {
  if (!room) return;
  room.localParticipant.audioTracks.forEach((pub) => {
    pub.mediaStreamTrack.enabled = enabled;
  });
}

export function disconnectFromRoom() {
  if (room) {
    room.disconnect();
    room = null;
  }
}
