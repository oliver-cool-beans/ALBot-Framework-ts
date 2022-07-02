import fetch from 'node-fetch'
import Party from '.'
import schedule from 'node-schedule'
import SpecialMonster from '../Task/SpecialMonster.js'

class DataPool {
  monsters: Array<string>
  data: { aldata: any, bank: any }
  party: Party
  addedTaskBuffer: Array<{botName: string, id: string}>
  constructor (Party: Party) {
    this.monsters = Party?.config?.monsters?.special || []
    this.party = Party
    this.addedTaskBuffer = []
    this.data = {
      aldata: [],
      bank: {}
    }
  }

  addPartyTasks () {
    const isActiveEvent = (event, botConfig): boolean => {
      const noSoloConfig = botConfig?.monsters?.noSolo || []
      if (noSoloConfig.includes(event.type) && !event.target) return false
      return event.x !== undefined && event.y !== undefined && event.map !== undefined
    }

    this.data.aldata.forEach((event, index) => {
      const args = {
        targetData: event
      }

      if (this.addedTaskBuffer.length > 10) this.addedTaskBuffer = this.addedTaskBuffer.slice(2)
      this.party.members.forEach((member) => {
        if (!isActiveEvent(event, member.config)) return
        if (member.character.ctype === 'merchant') return
        const SpecialMonsterTask = new SpecialMonster(member, undefined, event.serverIdentifier, event.serverRegion, [], [], args)
        if (this.addedTaskBuffer.find((task) => task.botName === member.name && task.id === event.id)) {
          this.addedTaskBuffer.push({ botName: member.name, id: SpecialMonsterTask.id })
        }
        if (!member.queue.findTaskById(SpecialMonsterTask.id)) {
          member.queue.addPartyTask(SpecialMonsterTask)
        }
      })
    })
  }

  start () {
    this.refreshAlData()
    this.refreshBankData()
    schedule.scheduleJob('*/1 * * * *', () => this.refreshAlData())
    schedule.scheduleJob('*/20 * * * *', () => this.refreshBankData())
  }

  async refreshAlData () {
    console.log('refreshData running', this.monsters)
    const url = 'https://aldata.earthiverse.ca/monsters/' + this.monsters.join(',')
    const response = await fetch(url)
    if (response.status === 200) {
      this.data.aldata = await response.json() || []
      this.addPartyTasks()
    } else {
      this.data.aldata = []
    }
  }

  async refreshBankData () {
    console.log('refreshBankDat running')
    const memberWithBank = this.party.allBots.find((bot) => bot.character && bot.character.bank && Object.keys(bot.character.bank).length > 1)
    if (!memberWithBank) return
    this.data.bank = memberWithBank.character.bank
  }
}

export default DataPool
