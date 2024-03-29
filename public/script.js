const socket = io("/");

const videoGrid = document.getElementById("video-grid");

const text = document.querySelector("input");
const textdisplay = document.querySelector(".message");

//peer connection where we recieve and create connection
const peer = new Peer(undefined, {
  //this is the path that we did in server.js
  //path: "/peerjs",
  host: "/", //what ever like localhost or any hosting page
  port: "3040",
});

const myvideoID = Math.random() * 10;

let myVideoStream;
const myvideo = document.createElement("video");
myvideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myvideo, stream, myvideoID);

    //answer the incoming call
    peer.on("call", (call) => {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      const remoteUserId = call.peer;
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, remoteUserId);
      });
    });

    // we are respoding to the request which came from the server
    socket.on("user-connected", (userid) => {
      console.log("new user connected", userid);
      connectToNewUser(userid, stream);
    });
  });

//we are listening to the peer connection
peer.on("open", (id) => {
  //we are req the room id to the server
  socket.emit("join-room", ROOMID, id);
});

const userVideo = {};
function connectToNewUser(userid, stream) {
  //Call another peer(ie another user) by calling peer.call with the peer ID of the destination peer.
  //When a peer calls you, the call event is emitted.
  //the Stream is my stream not the other user stream
  const call = peer.call(userid, stream);
  const video = document.createElement("video");
  const videoid = userid;
  console.log("video from the connected", video);
  //this stream is users stream
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, videoid);
  });
  userVideo[userid] = video;
}

function addVideoStream(video, stream, userid) {
  video.srcObject = stream;
  video.id = `user-video-${userid}`;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

/*
let text = $("input");

$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val());
    socket.emit("message", text.val());
    text.val("");
  }
});*/

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.trim().length !== 0) {
    console.log(text.value);
    socket.emit("message", text.value);
    text.value = "";
  }
});

socket.on("createMessage", (message) => {
  console.log(socket.id);
  const listitem = document.createElement("li");
  listitem.className = "limessage";

  listitem.textContent = `user: ${message}`;

  textdisplay.appendChild(listitem);

  textdisplay.scrollTop = textdisplay.scrollHeight;
});

//mute the video
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
  <i class="fa-solid fa-microphone"></i>
  <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
  <i class="unmute fa-solid fa-microphone-slash"></i>
  <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const stopOnVideo = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setOnVideo();
  } else {
    setstopVideo();

    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setstopVideo = () => {
  const html = `
  <i class="fa-solid fa-video"></i>
  <span>Stop Video</span>

  `;
  document.querySelector(".main_video_button").innerHTML = html;
};

const setOnVideo = () => {
  const html = `
  <i  class="stopvideo fa-solid fa-video-slash"></i>
  <span>On Video</span>

  `;
  document.querySelector(".main_video_button").innerHTML = html;
};

const leavemeeting = () => {
  socket.emit("leaveRoom");

  const videoTracks = myVideoStream.getVideoTracks();
  videoTracks.forEach((tracks) => {
    tracks.stop();
  });
  const audioTracks = myVideoStream.getAudioTracks();
  audioTracks.forEach((tracks) => {
    tracks.stop();
  });
  const myVideoElement = document.getElementById(`user-video-${myvideoID}`);

  myVideoElement.remove();

  const otherUserVideoElements = document.querySelectorAll(
    "video:not(#my-video)"
  );
  otherUserVideoElements.forEach((usersremove) => {
    usersremove.remove();
  });
};

const leaveMeetingButton = document.querySelector(".leave");
leaveMeetingButton.addEventListener("click", leavemeeting);

socket.on("user-left", (userid) => {
  removeUserVideo(userid);
});

function removeUserVideo(userid) {
  const videoElement = document.getElementById(`user-video-${userid}`);

  if (videoElement) {
    videoElement.remove();
  }
}
