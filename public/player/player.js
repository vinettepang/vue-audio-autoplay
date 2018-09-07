var player = {
    template: `
  <div :class="{ player, 'player_active': audioState }" :style="{ width: playerWidth }">
    <a href="javascript:void(0)" @click="playing()" :id="'palyerid'+mid">
      <Icon :type="playIcon"></Icon><span v-if="!audioState">播放吧</span><span v-else>暂停吧</span>
    </a>
    <div class="progress-bar" ref="progressBar" >
      <div class="bar-inner" v-if="audioState">
        <div class="progress" ref="progress"></div>
        <div class="timeBuffered" ref="timeBuffered"></div>
        <div class="progress-btn-wrapper" ref="progressBtn" @mousedown.prevent="progressMousedown" @touchstart.prevent="progressTouchStart" @touchmove.prevent="progressTouchMove"  @touchend="progressTouchEnd">
          <div class="progress-btn" ></div>
        </div>
      </div>
    </div>
    <span class="time">{{format(time-current)}}</span>
    <div class="playState">
      <i :class="playStateIcon">{{playStateIcon}}</i>
    </div>
  </div>`,
  // <i class="nc-icon nc-wifi" v-show="playState === 1">done</i>
  //     <i class="nc-icon nc-check-circle-07-2 icon-checked"  v-show="playState === 2">playing</i>
    // @touchstart.prevent="progressTouchStart" @touchmove.prevent="progressTouchMove"
    //         @touchend="progressTouchEnd"
    // @mousemove.prevent="progressMousemove" @mousemove.prevent="progressMouseup"
    props: {
        time: {
            type: Number,
            default: 60,
        },
        current: {
            type: Number,
            default: 0,
        },

        url: {
            type: String,
            default: ''
        },
        count: {
            type: Number,
            default: 0
        },
        index: {
            type: Number,
            default: 0
        },
        mid: {
            type: Number,
            default: 0
        },
        pptId: {
            type: Number,
            default: 0
        },
        ended: {
            type: Boolean,
            default: false
        },
    },
    data() {
        return {
            //进度条按钮宽度
            time: 0,
            current: 0,
            duration: 0,
            progressBtnWidth: 2,
            currentTime: 0, //当前播放的时长
            percent: 0, //currentTime / time
            audioState: false, //播放的状态
            bufferPercent: 0, //缓存的进度
            nowAudio: null, //最近播放的音频
            playState: 0, //播放的状态
            playerWidth: '90%', //播放器的宽度
            moveFlag: false,
        }
    },
    computed: {
        playIcon() {
            return this.audioState ? 'pause' : 'play'
        },
        playStateIcon(){
            return this.audioState ? '播放中' : this.ended ? '已播' : ''
        }
    },
    created() {
        this.touch = {}
    },
    mounted() {
        let _this = this
        Vue.nextTick(function() {})

        _this.playerWidth_init()
        if (!(navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
            document.addEventListener("mousemove", this.moveFn, !1)
            document.addEventListener("mouseup", this.endFn, !1)
        }

        // if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
        //     document.addEventListener("touchmove", this.moveFn, !1);
        //     document.addEventListener("touchend", this.endFn, !1)
        // }else{
        //     document.addEventListener("mousemove", this.moveFn, !1)
        //     document.addEventListener("mouseup", this.endFn, !1)
        // }
    },
    beforeDestroyed() {
        this.removeEventListeners()
    },
    watch: {
        ended(ended) {
            console.log(ended + ' ended')
            this.ended = ended
            this.playState = ended ? 1 : 0
        },
        time(time) {
            console.log(time)
            this.time = time
        },
        current(current) {
            this.current = current
            //this.time = this.time - parseInt(current)
            this.percent = this.current / this.time
            //console.log(this.percent)
        },
        audioState(state) {
            if (state) {
                this.playState = 2
            } else {
                if (this.playState != 2) {
                    this.playState = 0
                } else {
                    this.playState = this.ended ? 1 : 0
                }
            }
        },
        percent(newPercent) {

            const audio = this.$refs.audio
            if (newPercent >= 0 && !this.touch.initiated) {
                //进度条的宽度
                const barWidth = this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth
                //偏移的宽度
                const offsetWidth = newPercent * barWidth
                this._playOffset(offsetWidth)
            }

            // if(newPercent >= 1){
            //   this.playState = 2
            //   audio.pause()
            //   audio.currentTime = 0
            //   this._events.audio_play_next[0](audio, this.mid)
            // }

        },
        bufferPercent(newBufferPercent) {
            if (newBufferPercent >= 0) {
                //进度条的宽度
                const barWidth = this.$refs.progressBar.clientWidth * 1
                //缓存的宽度
                const offsetWidth = Math.min(newBufferPercent * barWidth, barWidth)

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
        getParentCurrent(current) {
            this.current = current
        },
        getParentAudioState(state) {
            this.audioState = state
        },
        getParentAudioEnd(state){
            this.playState = 2
        },
        removeEventListeners: function() {
            let self = this
            const audio = self.$refs.audio
            //audio.removeEventListener('timeupdate', self._currentTime)
            //audio.removeEventListener('canplay', self._durationTime)
        },
        _durationTime: function() {
            let _ = this
            const audio = _.$refs.audio
            //audio.timeDuration = parseInt(audio.duration)
            audio.timeDuration = parseInt(_.time) != 0 ? parseInt(_.time) - 1 : parseInt(audio.duration)
            _.duration = audio.timeDuration
        },
        //格式化时间
        format(interval) {
            interval = interval | 0
            const minute = interval / 60 >= 10 ? interval / 60 : '0' + interval / 60 | 0
            const second = interval % 60 >= 10 ? interval % 60 : '0' + interval % 60

            return `${minute}:${second}`
        },
        //修改播放的状态
        playing: function() {
            if (this.audioState) {
                this._events.pause[0](this.index)
            } else {
                this._events.play[0](this.index)
            }
        },
        playerWidth_init() {
            if (this.time == 0) {
                this._durationTime()
            } else {
                this.duration = this.time
            }
            if (this.duration <= 60 && this.duration >= 36) {
                this.playerWidth = this.duration / 60 * 90 + '%'
            } else if (this.duration > 60) {
                this.playerWidth = '90%'
            } else {
                this.playerWidth = '54%'
            }
        },
        _offset(offsetWidth) {
            this.$refs.progress.style.width = `${offsetWidth}px`
            this.$refs.progressBtn.style.transition = ''
            this.$refs.progressBtn.style.transform = `translate3d(${offsetWidth}px, 0, 0)`
        },
        _playOffset(offsetWidth) {
          if (this.$refs.progress) {
            this.$refs.progress.style.width = `${offsetWidth}px`
            //this.$refs.progressBtn.style.transition = 'all .1s'
            this.$refs.progressBtn.style.transform = `translate3d(${offsetWidth}px, 0, 0)`
            }
        },
        _newBufferOffset(offsetWidth) {
            this.$refs.timeBuffered.style.width = `${offsetWidth - 2}px`
        },
        //default.os.phone ? (document.addEventListener("touchmove", this.moveFn, !1), document.addEventListener("touchend", this.endFn, !1)) : (document.addEventListener("mousemove", this.moveFn, !1), document.addEventListener("mouseup", this.endFn, !1))

        //h5端的touch事件
        progressTouchStart(e) {
            console.log(e)
            this.touch.initiated = true
            this.touch.startX = e.touches[0].pageX
            this.touch.left = this.$refs.progress.clientWidth
        },
        progressTouchMove(e) {
            console.log(e)
            if (!this.touch.initiated) {
                return
            }
            const deltaX = e.touches[0].pageX - this.touch.startX
            const offsetWidth = Math.min(this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth, Math.max(0, this.touch.left + deltaX))

            this._offset(offsetWidth)
        },
        progressTouchEnd(e) {
            console.log(e)
            this.touch.initiated = false
            this._triggerPercent()
        },
        progressClick(e) {
            console.log(e)
            this._offset(e.offsetX)
            this._triggerPercent()
        },
        _triggerPercent() {
            const barWidth = this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth
            const percent = this.$refs.progress.clientWidth / barWidth
            console.log(percent)
            // this.currentTime = percent * this.duration
            // this.$refs.audio.currentTime = this.currentTime
            this.currentTime = percent * this.time
            //this.$refs.audio.currentTime = this.currentTime
            this._events.seek[0](this.currentTime)
            // if (this.audioState) {
            //   this.$refs.audio.play()
            // }
        },
        progressMousemove(e) {
            console.log(e)
        },
        progressMouseup(e) {
            console.log(e)
        },
        moveFn(e) {

            //console.log(e.clientX)
            // console.log(this.$refs.progressBar.clientWidth)
            this.clientX = e.clientX
            if (this.moveFlag && this.$refs.progress) {
              console.log(this.$refs.progress.clientWidth)
                if (this.$refs.progress.clientWidth <= 0) {
                  return
                }

                let offsetWidth = this.startWidth != '' ? this.clientX - this.startX + parseInt(this.startWidth) : this.clientX - this.startX
                this.offsetWidth = offsetWidth
                this.$refs.progress.style.width = `${offsetWidth}px`
                this.$refs.progressBtn.style.transform = `translate3d(${offsetWidth}px, 0, 0)`
                this.getAudioPosition()
            }
        },
        endFn(e) {
            // console.log(e)
            this.moveFlag = false
        },
        getAudioPosition() {
            let barWidth = this.$refs.progressBar.clientWidth * 1 - this.progressBtnWidth
            let barTime = this.time / barWidth
            let offsetTime = this.offsetWidth * barTime
            this.currentTime = offsetTime
            //this.$refs.audio.currentTime = this.currentTime
            this._events.seek[0](this.currentTime)
        },
        progressMousedown(e) {
            console.log('progressMousedown')
            this.startX = e.pageX
            this.startWidth = this.$refs.progress.style.width
            this.barWidth = this.$refs.progressBar.style.width
            this.moveFlag = true
        },
    }
}