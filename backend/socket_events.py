from flask import request
from flask_socketio import join_room, leave_room, emit
from backend import socketio
from backend.services.room_manager import RoomManager

room_manager = RoomManager()


@socketio.on('join_room')
def on_join(data):
    room = data['room']
    username = data['username']
    peer_id = data.get('peerId')

    join_room(room)

    existing = room_manager.get_users(room)
    if existing:
        emit('existing_users', {'users': existing}, to=request.sid)

    user_info = {'username': username, 'peerId': peer_id}
    room_manager.add_user(room, user_info)

    emit('user_joined', {
        'username': username,
        'peerId': peer_id,
        'message': f'{username} đã tham gia lớp.'
    }, room=room, include_self=False)


@socketio.on('leave_room')
def on_leave(data):
    room = data['room']
    username = data['username']
    peer_id = data.get('peerId')

    leave_room(room)
    room_manager.remove_user(room, peer_id)

    emit('user_left', {
        'username': username,
        'peerId': peer_id,
        'message': f'{username} đã rời khỏi phòng họp.'
    }, room=room, include_self=False)


@socketio.on('chat_message')
def handle_chat(data):
    emit('chat_message', data, room=data['room'])


@socketio.on('end_meeting')
def handle_end_meeting(data):
    emit('meeting_ended', {
        'message': 'Giáo viên đã kết thúc lớp học.'
    }, room=data['room'])


@socketio.on('draw_line')
def handle_draw(data):
    emit('draw_line', data, room=data['room'], include_self=False)


@socketio.on('save_whiteboard')
def save_whiteboard(data):
    room_manager.save_whiteboard(data['room'], data['image'])


@socketio.on('request_whiteboard')
def request_whiteboard(data):
    room = data['room']
    image = room_manager.get_whiteboard(room)
    if image:
        emit('load_whiteboard', {'image': image}, to=request.sid)


@socketio.on('start_timer')
def handle_start_timer(data):
    emit('timer_started', data, room=data['room'])


@socketio.on('stop_timer')
def handle_stop_timer(data):
    emit('timer_stopped', room=data['room'])


@socketio.on('subtitle_update')
def handle_subtitle(data):
    emit('subtitle_update', data, room=data['room'], include_self=False)
