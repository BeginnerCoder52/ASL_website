class RoomManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.room_whiteboards = {}
            cls._instance.room_users = {}
            cls._instance.room_stickies = {}
        return cls._instance

    def get_users(self, room):
        return self._instance.room_users.get(room, [])

    def add_user(self, room, user_info):
        if room not in self._instance.room_users:
            self._instance.room_users[room] = []
        self._instance.room_users[room].append(user_info)

    def remove_user(self, room, peer_id):
        if room in self._instance.room_users:
            self._instance.room_users[room] = [
                u for u in self._instance.room_users[room]
                if u.get('peerId') != peer_id
            ]
            if not self._instance.room_users[room]:
                del self._instance.room_users[room]

    def save_whiteboard(self, room, image):
        self._instance.room_whiteboards[room] = image

    def get_whiteboard(self, room):
        return self._instance.room_whiteboards.get(room)

    def get_stickies(self, room):
        return self._instance.room_stickies.get(room, [])

    def add_sticky(self, room, sticky):
        if room not in self._instance.room_stickies:
            self._instance.room_stickies[room] = []
        self._instance.room_stickies[room].append(sticky)

    def update_sticky(self, room, sticky):
        if room in self._instance.room_stickies:
            for i, s in enumerate(self._instance.room_stickies[room]):
                if s['id'] == sticky['id']:
                    self._instance.room_stickies[room][i] = sticky
                    return

    def remove_sticky(self, room, sticky_id):
        if room in self._instance.room_stickies:
            self._instance.room_stickies[room] = [
                s for s in self._instance.room_stickies[room]
                if s['id'] != sticky_id
            ]
