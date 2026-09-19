from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parent.parent/'design'
def screen(agent=False):
    parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960">']
    def rect(x,y,w,h,c,r=0,stroke=None): parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
    def text(x,y,t,s=13,c='#242c27',weight=400,mono=False): parts.append(f'<text x="{x}" y="{y}" font-family="{("SFMono-Regular,monospace" if mono else "DM Sans,PingFang SC,sans-serif")}" font-size="{s}" fill="{c}" font-weight="{weight}">{escape(t)}</text>')
    def line(x,y,w): rect(x,y,w,1,'#e7eae3')
    rect(0,0,1440,960,'#ffffff');rect(0,0,244,960,'#f7f8f5');rect(243,0,1,960,'#e7eae3')
    rect(24,26,32,32,'#355c48',9);text(31,49,'W',20,'#fff',600);text(67,46,'Work Studio',17,weight=650);text(25,86,'你的个人知识工作台',11,'#899187')
    rect(16,110,212,37,'#fff',7,'#e7eae3');text(30,134,'⌕   搜索你的知识',12,'#899187');text(190,134,'⌘ K',10,'#899187')
    rect(16,171,212,39,'#eaf0e8',7);text(30,196,'▦   知识库',13,'#355c48',600);text(201,196,'8',11,'#7a827a')
    text(30,239,'▤   每日笔记');text(30,282,'✧   LLM Wiki');text(186,282,'BETA',9,'#7a827a')
    line(24,310,196);text(26,343,'工作空间',10,'#899187',600);text(206,343,'+',18,'#899187')
    rows=[('⌄  wiki',377),('    ▧  开始使用',416),('    ▧  知识索引',454),('⌄  concepts',500),('    ▧  LLM Wiki',538),('    ▧  双向链接',576),('›  journal',622),('›  raw',664),('›  sources',706)]
    rect(16,393,212,35,'#e7ede4',6)
    for t,y in rows:text(27,y,t,12,'#355c48' if y==416 else '#646e64',600 if y==416 else 400)
    rect(18,824,208,70,'#eff2eb',9);text(31,849,'让每一个想法，有迹可循。',11,'#576b57');text(31,873,'本地文件 · 持续积累',10,'#899187')
    text(26,932,'●  本地工作空间',11,'#667966');text(194,932,'⚙',15,'#899187')
    text(275,38,'知识库  /  wiki  /',12,'#8a9288');text(389,38,'开始使用',12)
    rect(1287,17,126,32,'#355c48',7);text(1301,38,'✧  Codex   ⌘ J',12,'#fff')
    line(244,64,1196);text(281,111,'WORKSPACE / WELCOME',10,'#899187',500);text(280,154,'开始使用',28,weight=600)
    text(281,182,'把零散的想法，连成自己的知识。',12,'#899187');text(1167,147,'● 已保存到本地',11,'#7a827a')
    line(244,211,1196)
    text(280,239,'▧  开始使用.md',12);text(413,239,'×',14,'#899187')
    rect(1105,221,206,28,'#f4f5f1',6);rect(1171,223,67,24,'#fff',4);text(1125,240,'编辑',11,'#899187');text(1190,240,'双栏',11);text(1260,240,'阅读',11,'#899187')
    line(244,260,1196)
    end=1068 if agent else 1440
    mid=244+int((end-244)*.48)
    rect(244,261,mid-244,665,'#fcfcfa');rect(mid,261,1,665,'#e7eae3')
    text(265,291,'MARKDOWN',9,'#899187',600);text(mid+25,291,'预览',10,'#899187',500);line(244,310,end-244)
    code=['# 欢迎来到 Work Studio','', '> 一个安静的地方，用来思考、记录与连接。','','## 从一页笔记开始','','这里是你的个人 Wiki。所有内容都是','普通的 Markdown 文件，保存在 `wiki/`。','','你可以随时编辑，也可以交给 Codex，','一起让想法变得更清晰。','','## 建立你的知识网络','','- 用 [[LLM Wiki]] 整理原始资料','- 用 [[双向链接]] 连接相关想法','- 在每日笔记里，记录正在发生的事','','## 今天的小事','','- [x] 建立自己的工作空间','- [ ] 写下第一个想法','- [ ] 邀请 Codex 一起思考','','---','','不必一次整理完。知识会慢慢生长。']
    for i,t in enumerate(code):
        y=343+i*20
        text(263,y,str(i+1),10,'#b3b8ae',mono=True)
        text(298,y,t,11,'#355c48' if t.startswith(('#','>')) else '#60675f',600 if t.startswith('#') else 400,True)
    x=mid+35
    text(x,358,'欢迎来到 Work Studio',24 if not agent else 18,weight=600)
    rect(x,382,end-x-32,62,'#f1f4ee',7);text(x+17,419,'一个安静的地方，用来思考、记录与连接。',12 if not agent else 10,'#62745e')
    text(x,491,'从一页笔记开始',19,weight=600);text(x,526,'这里是你的个人 Wiki。所有内容都是',13,'#656f63');text(x,553,'普通的 Markdown 文件，保存在 wiki/。',13,'#656f63')
    text(x,592,'你可以随时编辑，也可以交给 Codex，',13,'#656f63');text(x,619,'一起让想法变得更清晰。',13,'#656f63')
    text(x,668,'建立你的知识网络',19,weight=600)
    text(x+3,705,'•   用 LLM Wiki 整理原始资料',13,'#355c48');text(x+3,736,'•   用双向链接连接相关想法',13,'#355c48');text(x+3,767,'•   在每日笔记里，记录正在发生的事',13,'#656f63')
    text(x,817,'今天的小事',19,weight=600);text(x,855,'☑  建立自己的工作空间',13,'#899187');text(x,886,'☐  写下第一个想法',13,'#656f63')
    line(244,926,1196);text(266,947,'Markdown    UTF-8',10,'#899187');text(1190,947,'写下来，才会发生。',10,'#899187')
    if agent:
        rect(1068,64,372,862,'#fbfcf9');rect(1068,64,1,862,'#e7eae3');text(1091,102,'✧  Codex',16,weight=600);text(1389,102,'×',18,'#899187');text(1091,129,'一起思考，让知识生长',11,'#899187');line(1068,151,372)
        rect(1090,173,327,35,'#f0f3ec',6);text(1104,195,'▧  上下文 · 开始使用.md',11,'#657660')
        text(1093,261,'从一个问题开始',21,weight=550);text(1093,292,'我可以阅读你的 Wiki，连接零散的想法，',12,'#899187');text(1093,316,'也可以和你一起整理知识。',12,'#899187')
        for i,t in enumerate(['总结当前文档','找出相关笔记与新连接','检查 Wiki 的缺失链接']):rect(1091,353+i*53,326,41,'#fff',7,'#e7eae3');text(1105,379+i*53,t,12,'#596756');text(1388,379+i*53,'↗',14,'#899187')
        rect(1090,760,328,133,'#fff',10,'#dce2d6');text(1104,789,'有什么想一起探索的？',12,'#899187');text(1105,868,'◉  只读问答',11,'#657660');rect(1377,852,28,28,'#355c48',7);text(1385,872,'↑',18,'#fff');text(1094,915,'Codex · 本地工作空间',10,'#899187')
    parts.append('</svg>');return ''.join(parts)
(OUT/'work-studio.svg').write_text(screen(),encoding='utf-8')
(OUT/'work-studio-agent.svg').write_text(screen(True),encoding='utf-8')
