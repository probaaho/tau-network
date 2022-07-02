### Testing centralized architecture

https://betterprogramming.pub/how-to-use-mysql-with-node-js-and-docker-7dfc10860e7c

docker run -p 3306:3306 --name nodejs-mysql -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=quarks_db -d mysql:5.7

docker container exec -it nodejs-mysql bash

mysql -u root -p