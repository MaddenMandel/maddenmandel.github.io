document.addEventListener('DOMContentLoaded', () => {
    // 遍历所有的代码块
    document.querySelectorAll('pre.highlight').forEach(pre => {
      // 创建复制按钮
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerText = 'Copy'; // 初始按钮文本
  
      // 将按钮添加到代码块的右上角
      pre.style.position = 'relative';
      pre.appendChild(button);
  
      // 添加点击事件
      button.addEventListener('click', () => {
        const code = pre.querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(() => {
          button.classList.add('copied');
          button.innerText = '✔️ Copied!'; // 更新按钮文本
  
          setTimeout(() => { 
            button.classList.remove('copied'); 
            button.innerText = 'Copy'; // 恢复按钮文本
          }, 2000); // 2秒后恢复
        }).catch(err => {
          console.error('复制失败: ', err);
        });
      });
    });
  });