export default class BeTween {
    static func_linear = 'linear'
    static func_ease = 'ease'
    static func_ease_in = 'ease-in'
    static func_ease_out = 'ease-out'
    static func_ease_in_out = 'ease-in-out'

    static ct_container = []
    static ct_id = 0
    _obj = null
    _todolist = []
    _isRemoved = false
    _onCompleteFunc = null

    /** private constructor */
    constructor(obj) {
        this._obj = obj
        this.tid = 'tid-' + obj.ct_id
    }

    static get(obj, onCompleteFunc) {
        obj.ct_id = ++this.ct_id
        let ct = new BeTween(obj)
        obj.wrapper = ct
        ct._onCompleteFunc = onCompleteFunc
        this.ct_container.push(ct)
        return ct
    }

    set(propertyObj) {
        this._todolist.push(async _ => {
            let ks = Object.keys(propertyObj)
            ks.forEach(k => this._obj.style[k] = propertyObj[k])
            return Promise.resolve()
        })
        return this._obj.wrapper
    }

    wait(time) {
        this._todolist.push(async _ => {
            return new Promise(resolve => {
                setTimeout(resolve, time)
            })
        })
        return this._obj.wrapper
    }

    to(propertyObj, time, ease) {
        this._todolist.push(async _ => {
            return new Promise(resolve => {
                let ks = Object.keys(propertyObj)
                const styleSheet = document.createElement("style");
                let now = this.tid + '-' + Date.now()
                let text = document.createTextNode(`
                    .play-${now}{
                        animation: ani-${now} ${time / 1000}s;
                        animation-timing-function: ${ease};
                    }
                    @keyframes ani-${now} {
                        to {${ks.map(k => k + ':' + propertyObj[k]).join(';') + ';'}}
                    }
                `);
                styleSheet.appendChild(text);
                document.body.append(styleSheet);
                this._obj.onanimationend = () => {
                    ks.forEach(k => this._obj.style[k] = propertyObj[k])
                    this._obj.classList.remove(`play-${now}`)
                    styleSheet.remove()
                    resolve()
                }
                requestAnimationFrame(() => this._obj.classList.add(`play-${now}`))
            })
        })
        return this._obj.wrapper
    }

    call(func) {
        this._todolist.push(_ => func())
        return this._obj.wrapper
    }

    pause() {
        this._obj.style.animationPlayState = 'paused'
    }

    resume() {
        this._obj.style.animationPlayState = 'running'
    }

    async start(times = 1) {
        if (times < 0) times = 0
        while (times) {
            if (this._isRemoved) break;
            for (let td = 0; td < this._todolist.length; td++) {
                await this._todolist[td]()
            }
            times--
        }
        this._onCompleteFunc()
        this._obj.wrapper.remove()
    }

    async loop() {
        while (true) {
            if (this._isRemoved) break;
            for (let td = 0; td < this._todolist.length; td++) {
                await this._todolist[td]()
            }
        }
    }

    remove() {
        let c = BeTween.ct_container;
        let idx = c.findIndex(item => item == this._obj.wrapper)
        if (c > -1) c.splice(idx, 1)
        this._isRemoved = true
        this._obj.onanimationend = null
        this._obj.wrapper.pause()
        this._obj.wrapper = null
        this._obj = null
        this._todolist.length = 0
    }
}