# BHServer Project

BHServer is responsible of getting the data in real-time from Bloodhound SSC into a live dashboard

server.js is the main code, it is listening to an Apache Kafka topic and published the real-time event to the dashboards's websocket.

