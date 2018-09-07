var player = {
  template: `
  <div class="player">
    <audio :src="url" ref="audio" @timeupdate="updateTime" style="display:none"></audio>
    <a href="javascript:void(0)" @click="playing()">
      <Icon :type="playIcon"></Icon>
    </a>
    <div class="progress-bar" ref="progressBar" @click="progressClick">
      <div class="bar-inner">
        <div class="progress" ref="progress"></div>
        <div class="timeBuffered" ref="timeBuffered"></div>
        <div class="progress-btn-wrapper" ref="progressBtn" @touchstart.prevent="progressTouchStart" @touchmove.prevent="progressTouchMove"
          @touchend="progressTouchEnd">
          <div class="progress-btn"></div>
        </div>
      </div>
    </div>
    <span class="time">{{format(time - currentTime)}}</span>
    <div class="playState" style="display: none">
      <i class="nc-icon nc-wifi"></i>
      <i class="nc-icon nc-check-circle-07-2 icon-checked"></i>
    </div>
  </div>`,
  props: {
    time: {
      type: Number,
      default: 60
    },
    url: {
      type: String,
      default: ''
    },
    count: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      //进度条按钮宽度
      progressBtnWidth: 2,
      currentTime: 0,    //当前播放的时长
      percent: 0,        //currentTime / time
      audioState: false, //播放的状态
      bufferPercent: 0   //缓存的进度
    }
  },
  computed: {
    playIcon() {
      return this.audioState ? 'pause' : 'play'
    }
  },
  created() {
    this.touch = {}
    const audio = this.$refs.audio
    console.log(audio.duration)
  },
  watch: {
    percent(newPercent) {
      if (newPercent >= 0 && !this.touch.initiated) {
        //进度条的宽度
        const barWidth = this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth - 30
        //偏移的宽度
        const offsetWidth = newPercent * barWidth

        this._playOffset(offsetWidth)
      }
    },
    bufferPercent(newBufferPercent) {
      if (newBufferPercent >= 0) {
        //进度条的宽度
        const barWidth = this.$refs.progressBar.clientWidth * 1 - 28
        //缓存的宽度
        const offsetWidth = newBufferPercent * barWidth

        this._newBufferOffset(offsetWidth)
      }
    },
    count(newCount) {
      if (newCount > 1) {
        this.$refs.audio.pause()
        this.audioState = false
      }
    }
  },
  methods: {
    //格式化时间
    format(interval) {
      interval = interval | 0
      const minute = interval / 60 | 0
      const second = interval % 60

      return `${minute}:${second}`
    },
    //修改播放的状态
    playing: function () {
      const audio = this.$refs.audio
      let _this = this

      this.audioState = !this.audioState
      this.audioState ? audio.play() : audio.pause()

      if (this.audioState && this.currentTime == this.time) {
        audio.currentTime = 0
      }

      this.audioState ? this.count++ : this.count--
      this._events.countchange[0](this.count)

      setTimeout(function () {
        if (_this.count > 1) {
          audio.play()
          _this.audioState = true
          _this.count--
          _this._events.countchange[0](_this.count)
        }
      }, 20)

    },
    updateTime(e) {
      const audio = this.$refs.audio
      let timeRanges = audio.buffered;
      let timeBuffered;
      if (timeRanges.length) {
        timeBuffered = timeRanges.end(timeRanges.length - 1);
      }

      this.currentTime = e.target.currentTime | 0
      this.percent = this.currentTime / this.time
      // 获取缓存进度，值为0到1
      this.bufferPercent = timeBuffered / audio.duration;

      if (this.currentTime === this.time) {
        this.audioState = false
        audio.pause()
      }
    },
    _offset(offsetWidth) {
      this.$refs.progress.style.width = `${offsetWidth}px`
      this.$refs.progressBtn.style.transition = ''
      this.$refs.progressBtn.style.transform = `translate3d(${offsetWidth}px, 0, 0)`
    },
    _playOffset(offsetWidth) {
      this.$refs.progress.style.width = `${offsetWidth}px`
      this.$refs.progressBtn.style.transition = 'all .1s'
      this.$refs.progressBtn.style.transform = `translate3d(${offsetWidth}px, 0, 0)`
    },
    _newBufferOffset(offsetWidth) {
      this.$refs.timeBuffered.style.width = `${offsetWidth}px`
    },
    //h5端的touch事件
    progressTouchStart(e) {
      this.touch.initiated = true
      this.touch.startX = e.touches[0].pageX
      this.touch.left = this.$refs.progress.clientWidth
    },
    progressTouchMove(e) {
      if (!this.touch.initiated) {
        return
      }
      const deltaX = e.touches[0].pageX - this.touch.startX
      const offsetWidth = Math.min(this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth, Math.max(0, this.touch.left + deltaX))

      this._offset(offsetWidth)
    },
    progressTouchEnd() {
      this.touch.initiated = false
      this._triggerPercent()
    },
    progressClick(e) {
      this._offset(e.offsetX)
      this._triggerPercent()
    },
    _triggerPercent() {
      const barWidth = this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth
      const percent = this.$refs.progress.clientWidth / barWidth

      this.currentTime = percent * this.time
      this.$refs.audio.currentTime = this.currentTime

      if (this.audioState) {
        this.$refs.audio.play()
      }
    }
  },

}