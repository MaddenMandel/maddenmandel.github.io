---
layout: post
title:  "Install Loki"
date:   2025-01-11 18:00:00

categories: tool
tags: architecture refactoring tool
author: "XueGang Zhang"
image: /images/logo.png
comments: true
published: true
---

# Install Loki

Owner: Xuegang Zhang

To install **Loki** version **3.1.2** on a Linux system, follow the steps below. Loki is an open-source log aggregation system developed by Grafana Labs, and you can install it using either pre-built binaries, Docker, or through package managers. We'll use pre-built binaries for this guide.

## Step 1: Download the Loki Binary

1. Go to the [Loki GitHub releases page](https://github.com/grafana/loki/releases) and find version **3.1.2**. Or use `wget` to directly download the binary:

```bash
 sudo wget https://github.com/grafana/loki/releases/download/v3.1.2/loki-linux-amd64.zip
```

2. Once downloaded, extract the `.zip` file:

```bash
 unzip loki-linux-amd64.zip
```

This will create a folder containing the Loki binary (`loki-linux-amd64`).

## Step 2: Move Loki to a System Directory

1. Move the extracted binary to a directory in your PATH (e.g., `/usr/local/bin`):

```bash
sudo mv loki-linux-amd64 /usr/local/bin/loki
```

1. Ensure the binary is executable:

```bash
sudo chmod +x /usr/local/bin/loki
```

## Step 3: Create a Configuration File (Optional)

```bash

  332  sudo mkdir -p /etc/loki
  sudo vim /etc/loki/local-config.yaml
```

1. local-config.yaml content

```bash
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9095

common:
  path_prefix: /loki/data  # 设置 Loki 数据的路径前缀，确保所有的路径都在这个目录下

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    resync_interval: 10m
  filesystem:
    directory: /loki/chunks

limits_config:
  retention_period: 90d  # 日志保留时间
  allow_structured_metadata: false  # 禁用结构化元数据

schema_config:
  configs:
    - from: 2020-10-21
      store: boltdb-shipper
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h  # 设置索引周期为 24 小时

compactor:
  working_directory: /loki/compactor  # compactor 存储路径

table_manager:
  retention_deletes_enabled: true
  retention_period: 90d

ingester:
  lifecycler:
    ring:
      kvstore:
        store: memberlist
      replication_factor: 1
  chunk_target_size: 1048576  # 每个 chunk 的目标大小
  max_chunk_age: 1h  # chunk 最大生命周期

memberlist:
  join_members: []  # 单节点配置为空列表，不需要加入集群
```

1. Config the category you want loki logfile save

```bash
  334  sudo mkdir -p /var/loki/chunks /var/loki/index /var/loki/cache /var/loki/compactor
  335  sudo chown -R loki:loki /var/loki
  336  sudo vim /etc/systemd/system/loki.service
```

```bash
[Unit]
Description=Loki
Documentation=https://grafana.com/docs/loki/latest/
After=network.target

[Service]
ExecStart=/usr/local/bin/loki -config.file=/etc/loki/local-config.yaml
Restart=on-failure
User=delian
Group=delian

[Install]
WantedBy=multi-user.target
```

```bash
03  sudo mkdir -p /loki/index
  504  sudo mkdir -p /loki/cache
  505  sudo mkdir -p /loki/chunks
  506  sudo mkdir -p /loki/compactor
  507  sudo chown -R loki:loki/loki/
  508  sudo chown -R delian:delian /loki/
  509  sudo chown delian:delian /usr/local/bin/loki
  510  sudo vim /etc/systemd/system/loki.service
  511  sudo systemctl daemon-reload
  512  sudo systemctl enable loki
  513  sudo systemctl start loki
  514  sudo systemctl status loki
  515  sudo journalctl -u loki -f
  516  loki --version
  517  sudo journalctl -u loki -f
```

## Install Promtail

1. First you can down load the Promtail zip file from github,https://github.com/grafana/loki/releases.

For example you download the 3.1.2 version 

```bash
wget https://github.com/grafana/loki/releases/download/v2.8.0/promtail-linux-amd64.zip
```

1. Second you unzip file, and move it the suit place.

```bash
unzip promtail-linux-amd64.zip
sudo mv promtail-linux-amd64 /usr/local/bin/promtail
```

1. Grant the promtail execute privilage

```bash
sudo chmod +x /usr/local/bin/promtail
```

1. Create the Promtail config file

```bash
sudo mkdir -p /etc/promtail
sudo vim /etc/promtail/promtail-config.yaml
```

this file config is my use;

```bash
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://192.168.18.58:3100/loki/api/v1/push
    batchsize: 1048576  # 批量大小，单位字节（1MB）
    batchwait: 2s  # 批量发送间隔

scrape_configs:
  - job_name: dl-underwriting-rule-db
    static_configs:
      - targets:
          - localhost
        labels:
          job: dl-underwriting-rule-db
          __path__: /var/log/dl-underwriting-rule-db/*log

  - job_name: dl-underwriting-rule
    static_configs:
      - targets:
          - localhost
        labels:
          job: dl-underwriting-rule
          __path__: /var/log/dl-underwriting-rule/*log

  - job_name: dl-underwriting-rule-hh
    static_configs:
      - targets:
          - localhost
        labels:
          job: dl-underwriting-rule-hh
          __path__: /var/log/dl-underwriting-rule-hh/*log
```

1. Create Promtail service file 

In order to Promtail can start as the system start, we need create a systemd service file.

```bash
sudo vim /etc/systemd/system/promtail.service

[Unit]
Description=Promtail - A log collection agent for Loki
Documentation=https://grafana.com/docs/loki/latest/clients/promtail/
After=network.target

[Service]
ExecStart=/usr/local/bin/promtail -config.file=/etc/promtail/promtail-config.yaml
Restart=on-failure
User=delian
Group=delian

[Install]
WantedBy=multi-user.target
```

1. Start the Promtail service

```bash
sudo systemctl daemon-reload
sudo systemctl start promtail
sudo systemctl enable promtail 
sudo systemctl status promtail

```

