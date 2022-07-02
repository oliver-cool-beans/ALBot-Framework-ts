import { ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot'
import { taskArgs } from '../types/index.js'

export default class Task {
  bot: Bot
  priority: number | undefined
  onStartTasks: Array<any>
  onRemoveTasks: Array<any>
  serverIdentifier: ServerIdentifier
  serverRegion: ServerRegion
  args: taskArgs
  id: string
  status: 'starting' | 'started' | 'removing' | 'stopped'

  constructor (bot: Bot, priority: number | undefined, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    this.serverIdentifier = serverIdentifier
    this.serverRegion = serverRegion
    this.id = this.createId(`${this.constructor.name}${this.serverRegion}${this.serverIdentifier}`)
    this.onStartTasks = onStartTasks
    this.onRemoveTasks = onRemoveTasks
    this.bot = bot
    this.priority = priority
    this.status = 'stopped'
    this.args = args
  }

  createId (string) {
    const buffer = Buffer.from(string)
    return buffer.toString('base64')
  }

  async run () {
    if (this.status === 'stopped') {
      try {
        await this.onStart()
      } catch (error) {
        this.bot.logger.error(`${this.bot.name} failed to start ${this.constructor.name}, onStart tasks failed - ${error}`)
        this.removeFromQueue(true)
      }
    }
    await this.loop().catch((error) => this.bot.logger.error(`${this.bot.name} failed to run ${this.constructor.name}, loop failed - ${error}`))
  }

  async onStart (): Promise<void> {
    this.status = 'starting'
    let hasFailed
    for (const i in this.onStartTasks) {
      await this.onStartTasks[i].run().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run before task ${this.constructor.name} - ${error}`)
        hasFailed = true
      })
    }
    if (!hasFailed) this.status = 'started'
    return hasFailed ? Promise.reject(new Error('Failed to complete all before tasks')) : Promise.resolve()
  }

  async loop (): Promise<void> {
  }

  async onRemove (): Promise<void> {
    this.status = 'removing'
    let hasFailed
    for (const i in this.onRemoveTasks) {
      await this.onRemoveTasks[i].run().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run after task ${this.constructor.name} - ${error}`)
        hasFailed = true
      })
    }
    return hasFailed ? Promise.reject(new Error('Failed to complete all after tasks')) : Promise.resolve()
  }

  async removeFromQueue (ignoreActions?: boolean): Promise<void> {
    if (!ignoreActions) {
      await this.onRemove().catch((error) => this.bot.logger.error(`${this.bot.name} failed onRemove in ${this.constructor.name} - ${error}`))
    }
    this.bot.queue.removeTask(this.id)
  }
}
