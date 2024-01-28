FROM docker.io/debian:sid

RUN apt update -y && apt install -y \
	flex \
	bison \
	bc \
	gcc \
	g++ \
	make \
	libelf-dev \
	rsync \
	libssl-dev \
	kmod \
	zstd \
	qemu-system-x86 \
	git-core

ADD https://s3.us-west-1.wasabisys.com/flowtr-bucket/binaries/bun /bin/bun
RUN chmod +x /bin/bun

