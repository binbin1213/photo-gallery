FROM nginx:alpine

# 复制网站文件
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY photo-manager.html /usr/share/nginx/html/
COPY reset.html /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/
COPY photos/ /usr/share/nginx/html/photos/

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]