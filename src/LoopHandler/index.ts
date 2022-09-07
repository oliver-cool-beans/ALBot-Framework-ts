import Bot from '../Bot/index.js'
import Loop from './loops/Loop.js'

export default class LoopHandler {
  loops: Array<{name: string, class: Loop}>
  loopScripts: Loop
  bot: Bot
  constructor (bot: Bot, loopScripts) {
    this.bot = bot
    this.loopScripts = loopScripts
    this.loops = []
  }

  start () {
    Object.entries(this.loopScripts).forEach(([name, LoopClass]) => {
      if (this.bot.loopOverrideList && !this.bot.loopOverrideList.includes(name)) {
        this.bot.logger.info(`${this.bot.name} ignorning loop ${name} - overidden`)
        return
      }
      if (this.bot.loopIgnoreList.includes(name)) {
        this.bot.logger.info(`${this.bot.name} ignorning loop ${name} - ignored`)
        return
      }
      const loopClass = new LoopClass(this.bot)
      loopClass.start()
      this.loops.push({ name, class: loopClass })
    })
  }

  async stopAll () {
    return await Promise.all(this.loops.map(async (loop) => {
      return await loop.class.stop()
    }))
  }
}
