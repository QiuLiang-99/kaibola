import { NotLoginError } from "~types/errors"
import type { Room } from "~types/Room"

const urlForSpecial = "https://api.bilibili.com/x/relation/tag/special";
/**
 * 获取B站用户的特殊关注列表
 * @returns {"code":0,"message":"0","ttl":1,"data":[1398337493]}
 */

async function biliFetchForSpecial(): Promise<Room[]> {
  let user = await fetch(urlForSpecial).then(data => data.json()).catch(error => {
    if (error instanceof NotLoginError) {
        throw error
      }
      console.error("获取bilibili数据失败")
      console.error(error)
      return []
  });
  let api = "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?"
  let uids = user.data
  for(let i in uids){
    api += 'uids[]=' + uids[i] + '&';
  }
  let obj = await fetch(api).then(res => res.json());
  return biliFilterForSpecial(obj)
}
/**
 * 
 * @param data.data 
    {
    "code": 0,
    "msg": "success",
    "message": "success",
    "data": {
        "1398337493": {
            "title": "我吃的和牛！为什么说我凄惨？",
            "room_id": 26545331,
            "uid": 1398337493,
            "online": 0,
            "live_time": 0,
            "live_status": 0,
            "short_id": 0,
            "area": 6,
            "area_name": "生活娱乐",
            "area_v2_id": 744,
            "area_v2_name": "虚拟Singer",
            "area_v2_parent_name": "虚拟主播",
            "area_v2_parent_id": 9,
            "uname": "鲸鱼娘西丝特official",
            "face": "https://i2.hdslb.com/bfs/face/1d30d595112d0d769c6e4c3ae1044ab6dadfa809.jpg",
            "tag_name": "日常,学习,萌宠,厨艺,手机直播",
            "tags": "虚拟主播,虚拟偶像,虚拟Vup,gamer,ACG宅",
            "cover_from_user": "https://i0.hdslb.com/bfs/live/new_room_cover/182312d213ff1a391a2966618cfdcd122147bb7d.jpg",
            "keyframe": "",
            "lock_till": "0000-00-00 00:00:00",
            "hidden_till": "0000-00-00 00:00:00",
            "broadcast_type": 0
        }
    }
 * @returns 
 */
const biliFilterForSpecial = (data: any): Room[] => {
  if (!data || !data.data ) {
    console.warn("B站数据格式异常:", data)
    return []
  }

  try {
    return data.data.map((item) => ({
      roomId: `bili_${item.roomid}`,
      roomName: item.title,
      streamerName: item.uname,
      cover: item.room_cover,
      avatar: item.face,
      isOpen: item.live_status === 1,
      platform: "bilibili",
      url: `https://live.bilibili.com/${item.roomid}`,
      areaName: item.area_v2_name
    }))
  } catch (error) {
    console.warn("解析B站数据失败:", error)
    return []
  }
}
export { biliFetchForSpecial, biliFilterForSpecial }
