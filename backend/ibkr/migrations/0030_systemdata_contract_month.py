# Generated by Django 5.1.5 on 2025-01-16 11:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ibkr', '0029_strikes_strike_info_strikes_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemdata',
            name='contract_month',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
