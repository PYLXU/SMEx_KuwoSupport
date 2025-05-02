const https = require('https');
const { type } = require('os');
const fs = require('fs');
const path = require('path');
const os = require('os');

/*
 * KuwoSupported 扩展 for SimMusic
 * 本扩展由 @PYLXU 编写
 * 父扩展基于 SimMusic 内置本地音乐加载器 修改
 * 本扩展基于 @PYLXU/BiliSupport 修改
 * 亦可用作扩展开发示例以添加其他音乐源
 * 若无特殊说明，基本所有的file变量格式都是“scheme: + <id>”，自己开发时候请不要忘了添加scheme:前缀
 */

/**************** 基础配置 ****************/
// 当没有config.setItem时，调用config.getItem会返回defaultConfig中的值

defaultConfig["ext.kuwo.musicList"] = [];
defaultConfig["ext.kuwo.maxTemp"] = 50;
defaultConfig["ext.kuwo.musicQuality"] = "standard";
defaultConfig["ext.kuwo.maxSearch"] = 20;
SettingsPage.data.push(
	{ type: "title", text: "[音源扩展] 酷我音乐支持" },
	{ type: "button", text: "🎉特别鸣谢", description: "Limeasy 为本扩展提供Api支持", button: "跳转首页", onclick: () => { webview(`https://www.limeasy.cn/`, { width: 1100, height: 750 }); } },
	{ type: "input", text: "最大缓存文件数", description: "设置缓存文件的最大数量", configItem: "ext.kuwo.maxTemp" },
	{ type: "input", text: "最大搜索结果数", description: "设置单页搜索结果的最大数量", configItem: "ext.kuwo.maxSearch" },
	{
		type: "select",
		text: "歌曲质量",
		description: "选择在线播放、缓存、下载时的音质，若歌曲无此音质或您无相应权限，会自动降级，建议在切换后清除缓存。",
		options: [
			["standard", "标准音质 (128 kbps)"],
			["exhigh", "高品质 (320 kbps)"],
			["lossless", "无损压缩 (FLAC)"],
			// ["hires", "高解析度音频 (Hi-Res, ~2000 kbps)"] // 酷我音乐的高解析度音频需要会员权限，暂时不支持
		],
		configItem: "ext.kuwo.musicQuality"
	},
	{
		type: "button",
		text: "清除歌曲缓存",
		description: "清除所有酷我音乐的缓存文件（包括歌曲名称索引）",
		button: "清除",
		onclick: () => {
			const tempDir = path.join(os.tmpdir(), 'sim-music.ext.kuwo', 'cache');
			if (fs.existsSync(tempDir)) {
				fs.readdirSync(tempDir).forEach(file => {
					fs.unlinkSync(path.join(tempDir, file));
				});
				alert("缓存已清除");
			} else {
				alert("没有缓存文件");
			}
		}
	},
	{
		type: "button",
		text: "清除歌曲名称缓存（极不推荐）",
		description: "清除所有歌曲名称索引，可能会导致已有歌曲信息获取失败",
		button: "清除",
		onclick: () => {
			cacheSongName.clear();
			alert("歌曲名称缓存已清除");
		}
	},
	{
		type: "button",
		text: "打开缓存目录",
		description: "打开酷我音乐的缓存文件夹",
		button: "打开",
		onclick: () => {
			const tempDir = path.join(os.tmpdir(), 'sim-music.ext.kuwo', 'cache');
			if (fs.existsSync(tempDir)) {
				require('child_process').exec(`start "" "${tempDir}"`);
			} else {
				alert("缓存目录不存在");
			}
		}
	}
);

/**************** 左侧导航 ****************/
// 歌单功能尚未支持
// const elements = {};
// ExtensionConfig.kuwo.musicList = {
// 	async _import(callback, id, isUpdate = false) {
// 		let list = config.getItem("ext.kuwo.musicList");
// 		if (!isUpdate) {
// 			for (let entry of list) {
// 				if (entry.id == id) {
// 					return alert("此歌单「" + entry.name + "」已被添加，请尝试删除后重试。");
// 				}
// 			}
// 		}
// 		try {
// 			const response = await fetch("https://api.bilibili.com/x/web-interface/view?bvid=" + id);
// 			const metadata = await response.json();
// 			prompt("请输入歌单名称，留空使用视频名称", async (name) => {
// 				if (name == "") name = metadata.data.title;
// 				const bvid = metadata.data.bvid;
// 				let resultArray = [];

// 				const pagelistResponse = await fetch("https://api.bilibili.com/x/player/pagelist?bvid=" + bvid);
// 				const pagelist = await pagelistResponse.json();
// 				const ugcSeason = metadata.data.ugc_season;
// 				console.log(ugcSeason.sections[0].episodes.map(item => "bilibili:" + item.bvid + "-default"));
// 				if (ugcSeason) {
// 					resultArray = resultArray.concat(ugcSeason.sections[0].episodes.map(item => "bilibili:" + item.bvid + "-default"));

// 					if (isUpdate) {
// 						list = list.filter((it) => it.id != id);
// 					}
// 					const newEntry = { id, name, songs: resultArray };
// 					list.push(newEntry);
// 					config.setItem("ext.kuwo.musicList", list);
// 					if (isUpdate) {
// 						ExtensionConfig.bilibili.musicList.switchList(id);
// 					}
// 					alert("成功导入歌单 " + name + "，共导入 " + resultArray.length + " 首歌曲。", callback);
// 				}

// 				// 因为confirm限制，做并行会导致某些问题，因此分集暂不支持
// 				// if (pagelist.data.length > 1) {
// 				// 	const addEpisodes = await new Promise((resolve) => {
// 				// 		confirm("此视频存在分集，是否将分集作为歌单添加？", resolve);
// 				// 	});
// 				// 	if (addEpisodes) {
// 				// 		resultArray = resultArray.concat(pagelist.data.map(item => "bilibili:" + bvid + "-" + item.cid));
// 				// 	}
// 				// }
// 			});
// 		} catch (err) {
// 			alert("导入歌单失败，请稍后重试：" + err);
// 		}
// 	},
// 	add(callback) {
// 		prompt("请输入Bilibili视频 分享 URL 或 ID 以导入歌单", async (input) => {
// 			let id;
// 			try {
// 				if (/^[a-zA-Z0-9]+$/.test(input)) {
// 					id = input;
// 				} else {
// 					const url = new URL(input);
// 					const pathParts = url.pathname.split('/');
// 					id = pathParts.find(part => part.startsWith('BV'));
// 					if (!id || !/^[a-zA-Z0-9]+$/.test(id)) {
// 						throw 0;
// 					}
// 				}
// 			} catch {
// 				return alert("无法解析视频 ID，请检查您输入的内容。");
// 			}
// 			await ExtensionConfig.bilibili.musicList._import(callback, id);
// 		});
// 	},
// 	renderList(container) {
// 		const list = config.getItem("ext.bilibili.musicList");
// 		if (!list) return;
// 		if (list.length == 0) return;
// 		list.forEach((entry) => {
// 			const element = document.createElement("div");
// 			element.textContent = entry.name;
// 			element.onclick = () => this.switchList(entry.id);
// 			element.oncontextmenu = (event) => {
// 				new ContextMenu([
// 					{ label: "查看歌曲", click: element.click },
// 					{
// 						label: "重新导入歌单",
// 						click() {
// 							confirm(`确认重新导入Bilibili歌单 ${entry.name} 吗？`, () => {
// 								ExtensionConfig.bilibili.musicList._import(null, entry.id, true);
// 							});
// 						}
// 					},
// 					{
// 						label: "从列表中移除",
// 						click() {
// 							confirm(`确认移除Bilibili歌单 ${entry.name} 吗？`, () => {
// 								const currentList = config.getItem("ext.bilibili.musicList");
// 								config.setItem("ext.bilibili.musicList", currentList.filter((it) => it.id != entry.id));
// 								if (element.classList.contains("active")) {
// 									switchRightPage("rightPlaceholder");
// 								}
// 								element.remove();
// 							});
// 						}
// 					}
// 				]).popup([event.clientX, event.clientY]);
// 			};
// 			elements[entry.id] = element;
// 			container.appendChild(element);
// 		});
// 	},
// 	switchList(id) {
// 		const entry = config.getItem("ext.bilibili.musicList").find((it) => it.id == id);
// 		renderMusicList(entry.songs, {
// 			uniqueId: "bilibili-list-" + id,
// 			errorText: "该歌单为空",
// 			menuItems: generateMenuItems(),
// 			musicListInfo: { name: entry.name }
// 		}, false);
// 		document.querySelectorAll(".left .leftBar div").forEach((it) => {
// 			if (it.classList.contains("active")) {
// 				it.classList.remove("active");
// 			}
// 		});
// 		elements[id].classList.add("active");
// 	}
// };

/**************** 获取数据 ****************/
// 这个函数用于读取音乐元数据，不管你是本地还是在线，无所谓你咋获取，最后都调callback(data)就行。
// 如果是在线的用fetch就更好做，直接修改我musicmetadata的promise就得
//【注意：读取失败可以返回null，各字段值可以没有】
ExtensionConfig.kuwo.readMetadata = async (file) => {
	const id = file.replace("kuwo:", "");
	const response = await fetch(`https://api.limeasy.cn/kwmpro/info/?key=${cacheSongName.get(id)}&id=${id}`);
	const metadata = await response.json();
	return {
		title: metadata.name,
		artist: metadata.artist,
		album: metadata.album,
		time: metadata.duration,
		cover: metadata.pic
	};
};

/**************** 歌曲播放 ****************/
ExtensionConfig.kuwo.player = {
	// 这个函数用于获取播放地址，返回值可以是本地文件地址 / http(s)地址 / blob地址 / base64 dataurl，不成功可以用空参数调callback
	//【注意：读取失败return可以用空串】
	async getPlayUrl(file) {
		const tempDir = path.join(os.tmpdir(), 'sim-music.ext.kuwo', 'cache');
		const id = file.replace("kuwo:", "");
		const cacheFilePath = path.join(tempDir, `${id}.mp3`);

		try {
			await fs.access(cacheFilePath);
			return `file://${cacheFilePath}`;
		} catch { }

		try {
			await fs.promises.mkdir(tempDir, { recursive: true });
		} catch (err) {
			console.error("创建缓存目录失败", err);
		}

		let downloadUrl;
		try {
			const response = await fetch(`https://api.limeasy.cn/kwmpro/v1/?id=${id}&quality=${config.getItem("ext.kuwo.musicQuality")}`);
			const data = await response.json();
			if (data.code === 200 || data.code === 201) {
				downloadUrl = data.url;
			} else {
				console.error("获取下载链接失败", data);
				return "";
			}
		} catch (e) {
			console.error("请求下载地址失败", e);
			return "";
		}

		try {
			const res = await fetch(downloadUrl);
			const buffer = await res.arrayBuffer();

			fs.writeFile(cacheFilePath, Buffer.from(buffer), (err) => {
				if (err) {
					console.error("写入文件失败", err);
					return "";
				}
				// 成功写入
			});
		} catch (error) {
			console.error("下载文件失败", error);
			return "";
		}

		// 删除最旧的一个文件以保持缓存数量
		try {
			const maxTemp = config.getItem("ext.kuwo.maxTemp", 50);
			const files = await fs.promises.readdir(tempDir);
			if (files.length > maxTemp) {
				const sorted = await Promise.all(
					files.map(async f => {
						const s = await fs.promises.stat(path.join(tempDir, f));
						return { name: f, mtime: s.mtime };
					})
				);
				sorted.sort((a, b) => a.mtime - b.mtime);
				await fs.promises.unlink(path.join(tempDir, sorted[0].name));
			}
		} catch (e) {
			console.warn("清理缓存失败", e);
		}

		return `file://${cacheFilePath}`;
	},
	// 这个函数用于（在本地索引没有歌词的情况下获取歌词），例如在线播放时把歌词全部写到索引不太现实，就会调用这个方法直接读取
	//【注意：读取失败return可以用空串】
	async getLyrics(file) {
		const id = file.replace("kuwo:", "");
		try {
			const response = await fetch(`https://api.limeasy.cn/kwmpro/lyric/?id=${id}`);
			const data = await response.json();
			let lyrics = '';

			// 转为LRC再返回
			if (data.jlx === 1 && data.lyrics && data.lyrics.data) {
				lyrics = data.lyrics.data.map(item => {
					const minutes = Math.floor(item.time / 60000).toString().padStart(2, '0');
					const seconds = ((item.time % 60000) / 1000).toFixed(2).padStart(5, '0');
					return `[${minutes}:${seconds}]${item.text}`;
				}).join('\n');
			}

			console.log(lyrics)

			return lyrics;
		} catch (error) {
			console.error("Error fetching lyrics:", error);
			return "";
		}
	}
};

/**************** 歌曲搜索 ****************/
ExtensionConfig.kuwo.search = async (keyword, _page) => {
	let resultArray = [];
	const response = await fetch(`https://api.limeasy.cn/kwmpro/search/?key=${encodeURI(keyword)}&p=${_page}&n=${config.getItem("ext.kuwo.maxSearch")}`);
	const result = await response.json();
	result.abslist.forEach(item => {
		cacheSongName.save(item.songid, item.artist + " " + item.name);
		resultArray.push("kuwo:" + item.songid);
	});

	return {
		files: resultArray,
		menu: [DownloadController.getMenuItems()],
		hasMore: true
	};
}

const cacheSongName = {
	// 保存歌曲名称到 localStorage
	save(songId, songName) {
		let cache = JSON.parse(localStorage.getItem("kuwoSongCache")) || {};
		cache[songId] = songName;
		localStorage.setItem("kuwoSongCache", JSON.stringify(cache));
	},

	// 获取歌曲名称从 localStorage
	get(songId) {
		let cache = JSON.parse(localStorage.getItem("kuwoSongCache")) || {};
		return cache[songId] || null;
	},

	// 删除指定歌曲名称缓存
	remove(songId) {
		let cache = JSON.parse(localStorage.getItem("kuwoSongCache")) || {};
		delete cache[songId];
		localStorage.setItem("kuwoSongCache", JSON.stringify(cache));
	},

	// 清空所有缓存
	clear() {
		localStorage.removeItem("kuwoSongCache");
	}
};
