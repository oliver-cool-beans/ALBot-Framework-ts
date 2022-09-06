import Task from '../Task/index.js'

export default class Queue {
  private queue: Array<Task>
  private partyQueue: Array<Task>
  private logger: any
  constructor (logger) {
    this.queue = []
    this.partyQueue = []
    this.logger = logger
  }

  private sortQueue (): void {
    this.queue = this.queue.sort((a, b) => (a.priority || 99) - (b.priority || 99))
    // this.partyQueue = this.partyQueue.sort((a, b) => (a.priority || 99) - (b.priority || 99))
  }

  getQueue (): Array<Task> {
    return this.queue
  }

  getPartyQueue (): Array<Task> {
    return this.partyQueue
  }

  getQueueSize (): number {
    return this.queue.length
  }

  getPartyQueueSize (): number {
    return this.partyQueue.length
  }

  getRunningTask (): Task {
    if (this.queue.length && this.queue[0].constructor.name === 'BankItems') {
      return this.queue[0]
    }
    return this.partyQueue[0] || this.queue[0] || null
  }

  purgeQueue (): void {
    this.queue = []
    this.partyQueue = []
  }

  async runQueueTask () : Promise<void> {
    if (this.queue.length && this.queue[0].constructor.name === 'BankItems') {
      return await this.queue[0].run()
    }
    if (this.partyQueue[0]) return await this.partyQueue[0].run()
    if (this.queue[0]) return await this.queue[0].run()
  }

  findTaskById (id: string): Task | undefined {
    return this.queue.find((queueTask) => queueTask.id === id) ||
    this.partyQueue.find((queueTask) => queueTask.id === id)
  }

  findTaskByName (name: string): Task | undefined {
    return this.queue.find((queueTask) => queueTask?.constructor?.name === name)
  }

  removeTask (id: string): boolean {
    const task = this.findTaskById(id)
    if (!task) return false
    this.queue = this.queue.filter((task) => task.id !== id)
    this.partyQueue = this.partyQueue.filter((task) => task.id !== id)
    this.sortQueue()
    this.logger.info(`Removed task ${task?.constructor?.name} - ${id}, queue size: ${this.queue.length} partyQueue size ${this.partyQueue.length}`)
    return true
  }

  addTask (task: Task): boolean {
    if (this.findTaskById(task.id)) return false
    if (!task.priority) task.priority = 99 + this.getQueueSize()
    this.queue.push(task)
    this.sortQueue()
    return true
  }

  addPartyTask (task: Task): boolean {
    if (this.findTaskById(task.id)) return false
    if (!task.priority) task.priority = 99 + this.getPartyQueueSize()
    this.partyQueue.push(task)
    return true
  }
}
