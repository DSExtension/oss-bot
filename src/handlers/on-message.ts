import {
  log,
  Message,
  Wechaty,
}             from 'wechaty'

import moment from 'moment'

import {
  BOT_ROOM_ID,
}                   from '../config'
import { VoteManager } from '../managers/vote-manager'
import { Chatops } from '../chatops'

const BORN_TIME = Date.now()

export default async function onMessage (
  this    : Wechaty,
  message : Message,
): Promise<void> {
  const text    = message.text()
  const contact = message.from()
  if (!contact) {
    return
  }
  if (text.toLowerCase() === 'oss') {

    // To Be Fix: Change "OSS Bot ChatOps" Group Name to actual group name
    log.info('on-message', 'Begin to find the OSS Bot ChatOps room')
    const room = this.Room.load(BOT_ROOM_ID)

    if (room) {
      await room.add(contact)

      // To Be Fix: Change a formal welcome message
      await room.say('Welcome to join OSS Bot ChatOps Group', contact)
    }
  }
  log.info('on-message', 'onMessage(%s)', message)

  try {
    await VoteManager.checkVote(message)
  } catch (e) {
    log.error('on-message', 'Failed to check vote for the message:\n', e)
  }

  await directMessage(message)
  await mentionMessage(message)

  await dingDong.call(this, message)
  await ctpStatus(this, message)
}

async function ctpStatus (
  wechaty: Wechaty,
  message: Message,
): Promise<void> {
  if (message.self()) {
    return
  }

  const room = message.room()
  if (!room) {
    return
  }

  // ChatOps - CTP Status
  const CTP_STATUS_ROOM_ID = '17962906510@chatroom'
  if (room.id !== CTP_STATUS_ROOM_ID) {
    return
  }

  const text = await message.mentionText()
  if (!text.match(/^#\w+/)) {
    return
  }

  const cmd = text.replace(/^#/, '')

  let reply
  if (cmd.match(/^ding$/i)) {
    reply = 'dong'
  } else if (cmd.match(/^uptime$/i)) {
    const time = moment(BORN_TIME).fromNow()
    reply = `I'm online ${time}`
  } else {
    reply = 'unknown CTP command'
  }

  await message.say(reply)
  await wechaty.sleep(1)
}

async function dingDong (
  this:     Wechaty,
  message:  Message,
) {
  log.info('on-message', 'dingDong()')

  let text = message.text()
  const type = message.type()
  const room = message.room()
  // const from = message.from()
  const mentionSelf = await message.mentionSelf()

  if (room) {
    if (!mentionSelf) {
      return
    }

    log.info('on-message', 'dingDong() message in room and mentioned self')
    text = await message.mentionText()
    console.info('mentionText', text)
  }

  if (type === Message.Type.Text) {
    if (text.match(/^#ding$/i)) {
      await message.say('dong')
    }
  }

}

async function directMessage (
  message: Message,
): Promise<void> {
  const room = message.room()
  if (room) {
    return
  }

  // direct message
  await Chatops.instance().say(message)
}

async function mentionMessage (
  message: Message,
): Promise<void> {
  const room = message.room()
  if (!room) {
    return
  }

  const mentionSelf = await message.mentionSelf()
  if (!mentionSelf) {
    return
  }

  await Chatops.instance().say(message)
}
