(function () {
  var video = document.querySelector('.stars');
  if (!video) return;

  video.defaultMuted = true;
  video.muted = true;

  function resumeBackground() {
    if (document.hidden || !video.paused) return;
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(function () {});
  }

  video.addEventListener('ended', function () {
    video.currentTime = 0;
    resumeBackground();
  });

  video.addEventListener('pause', function () {
    if (!document.hidden && !video.ended) {
      window.setTimeout(resumeBackground, 100);
    }
  });

  video.addEventListener('stalled', resumeBackground);
  window.addEventListener('pageshow', resumeBackground);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) resumeBackground();
  });

  resumeBackground();
})();
