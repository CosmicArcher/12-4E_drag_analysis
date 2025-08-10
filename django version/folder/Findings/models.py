from django.db import models
import math

# Create your models here.
class Setup(models.Model):
    formation = models.CharField(max_length = 15)
    fairy = models.CharField(max_length = 15)
    speed = models.PositiveSmallIntegerField(default = 4)
    has_HG = models.BooleanField(default = False)
    tank = models.CharField(max_length = 15)
    has_armor = models.BooleanField(default = True)
    DPS = models.CharField(max_length = 30)
    has_chip = models.BooleanField(default = True)
    max_HP = models.PositiveSmallIntegerField()
    damage = models.PositiveSmallIntegerField()
    def __str__(self):
        setupName = ""
        if self.has_chip:
            setupName = "Chipped "
        else:
            setupName = "Chipless "
        setupName += self.DPS.lower() + " " + self.tank + " "
        if self.tank == "M16":
            if self.has_armor:
                setupName += "SPEQ+Armor "
            else:
                setupName += "SPEQ+Exo "
        setupName += self.fairy + " "
        if self.has_HG:
            setupName += "Jill "
        else:
            setupName += "Only "
        setupName += self.formation + " " + str(self.speed) + " Speed"
        return setupName
    
    def Perc_Damage(self):
        return round(self.damage / self.max_HP * 100, 2)
    
    def Total_Repair(self):
        if self.tank == "M16":
            return round(self.Perc_Damage() * 0.3 * 8.2, 2)
        else :
            return round(self.Perc_Damage() * 0.3 * 16.1, 2)
