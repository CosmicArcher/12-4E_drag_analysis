from django.urls import path

from . import views

app_name = "dataHandling"
urlpatterns = [
    path("index/", views.index, name="Index"),
    path("newData/", views.newData, name="New Data"),
    path("add/", views.addData, name="add"),
    path("loadCSV/", views.loadCSV, name="Load CSV"),
    path("deleteData/", views.deleteData, name="Delete Data"),
    path("delete/", views.removeData, name="delete"),
    path("permutationTests/", views.permutationPage, name="Permutation Tests"),
    path("writePermutation/", views.writePermutationResults, name="write result")
]