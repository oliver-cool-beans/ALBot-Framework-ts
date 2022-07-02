import Loop from './Loop.js'

export default class LootLoop extends Loop {
  async loop (): Promise<void> {
    if (!this.bot.character.party) {
      const memberOnServer = this.bot.party.members.find((member) => {
        return member.getServerIdentifier() === this.bot.getServerIdentifier() &&
          member.getServerRegion() === this.bot.getServerRegion()
      })

      if (memberOnServer && memberOnServer.name !== this.bot.name) {
        this.bot.character.sendPartyRequest(memberOnServer.name)
      }
    }
  }
}
