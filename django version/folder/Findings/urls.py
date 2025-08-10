from django.urls import path

from . import views

app_name = "Findings"
urlpatterns = [
    path("introduction/", views.introduction, name="Introduction"),
    path("gameBasics/", views.basics, name="GameBasics"),
    path("summary/", views.summary, name="Summary"),
    path("viewData/", views.viewData, name="View Raw Data"),
    path("viewCharts/", views.viewCharts, name="View Charts"),
    path("permutationTests/", views.permutationTests, name="Permutation Tests"),
]