var posts=["2026/03/11/QT-C++基础/","2026/03/11/vs调用matlab生成的dll文件/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };