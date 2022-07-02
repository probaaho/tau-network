import random
import time
from datetime import datetime

from locust import HttpUser, task, between, tag


class WebUser(HttpUser):
    wait_time = between(1, 5)
    host = "http://"

    centralized_users = ['alice@org.com', 'bob@org.com', 'charlie@org.com']
    centralized_token = 'qwerty12345'
    centralized_channels = ['channel-123', 'channel-23', 'channel-1']

    api_centralized_send_message = '10.100.222.178:3000/sendMessage'
    api_centralized_read_message = '10.100.222.178:3000/readMessage'

    # -----------
    api_quarks_send_message = '10.100.222.178:3001/sendMessage'
    api_quarks_read_message = '10.100.222.178:3001/readMessage'

    quarks_users = ['alice@org1.com']
    quarks_channels = ['channel-123']

    @tag('centralized')
    @task(1)
    def centralized_send_message(self):
        user_email = random.choice(self.centralized_users)
        user_channel = random.choice(self.centralized_channels)
        user_text = self.generate_text(username=user_email)

        json_body = {
            "email": user_email,
            "text": user_text,
            "channel": user_channel
        }

        headers = {
            'token': self.centralized_token
        }

        self.client.post(url=self.api_centralized_send_message, json=json_body, headers=headers)

    @tag('centralized')
    @task(2)
    def centralized_read_message(self):
        user_email = random.choice(self.centralized_users)
        user_channel = random.choice(self.centralized_channels)

        json_body = {
            "email": user_email,
            "channel": user_channel
        }

        headers = {
            'token': self.centralized_token
        }

        self.client.post(url=self.api_centralized_read_message, json=json_body, headers=headers)

    @tag('quarks')
    @task(1)
    def quarks_send_message(self):
        user_email = random.choice(self.quarks_users)
        user_channel = random.choice(self.quarks_channels)
        user_text = self.generate_text(username=user_email)

        json_body = {
            "user": user_email,
            "text": user_text,
            "channel": user_channel
        }

        self.client.post(url=self.api_quarks_send_message, json=json_body)

    @tag('quarks')
    @task(2)
    def quarks_read_message(self):
        user_email = random.choice(self.quarks_users)
        user_channel = random.choice(self.quarks_channels)

        json_body = {
            "user": user_email,
            "channel": user_channel,
            "from_timestamp": self.get_timestamp()
        }

        self.client.get(url=self.api_quarks_read_message, json=json_body)

    def generate_text(self, username):
        return 'I am {}. current time is {}'.format(username, datetime.now())

    def get_timestamp(self):
        return f'{(time.time() - 10.00) * 1000000000:.0f}'
