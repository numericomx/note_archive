
#Definir workspace
setwd("C:\\Users\\Adrián\\Documents\\Numerico\\Pokedex\\Data")

#librerías
library(stringr)
library(readr)
library(dplyr)
library(tibble)
library(tidyr)
library(ggplot2)
library(lubridate)
library(ggmap)
library(leaflet)
library(maps)
library(MASS)
library(raster)
library(DT)


data_raw <-  read_csv("pokemon_sample.csv")

pokestations <- read_csv("pokemon_pokestation.csv")

gyms <- read_csv("pokemon_gym.csv")



data_raw$disappear_time <- as.POSIXct(data_raw$disappear_time,origin = "1970-01-01", tz="GMT")

pokemon_db <- read_csv("pokemon_db.csv")

df <- data_raw %>% 
        mutate(pokemon = str_to_lower(name)) %>% 
        left_join(pokemon_db, by = "pokemon")

poke_summary_type_empiric <- df %>% 
                  group_by(type_1) %>% 
                  summarize(count_empiric=n()) %>% 
                  arrange(desc(count_empiric)) %>% 
                  na.omit %>% 
                  mutate(count_empiric=100*count_empiric/sum(count_empiric))

poke_summary_type_original <- pokemon_db[1:150,] %>% 
                                group_by(type_1) %>% 
                                summarize(count_original=n()) %>% 
                                arrange(desc(count_original)) %>% 
                                mutate(count_original=100*count_original/sum(count_original))

poke_summary_all <- left_join(poke_summary_type_empiric, 
                              poke_summary_type_original, by="type_1") %>% 
                    gather(sample, frequency, 2:3)

#Gr?fica1
ggplot(poke_summary_all) +
  aes(x = type_1, y = frequency, fill = sample) +
  geom_bar(stat = "identity", position= position_dodge()) +
  coord_flip()

      
leaflet(df %>% filter(type_1=="water")) %>% 
  addTiles() %>% 
  addCircleMarkers(~lng,
                   ~lat,  
                   popup = ~paste(type_1, name), 
                   color = ~color_1 ,
                   radius=2)

leaflet(df %>% filter(as.Date(disappear_time)>="2016-07-21", type_1 == "electric")) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)


leaflet(df %>% filter(as.Date(disappear_time)<=as.Date("2016-07-18"))) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)

leaflet(df %>% filter(as.Date(disappear_time)>as.Date("2016-07-18"),
                      as.Date(disappear_time)<=as.Date("2016-07-20"))) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)

leaflet(df %>% filter(as.Date(disappear_time)>as.Date("2016-07-20"),
                      as.Date(disappear_time)<=as.Date("2016-07-21"))) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)

leaflet(df %>% filter(as.Date(disappear_time)>as.Date("2016-07-21"),
                      as.Date(disappear_time)<=as.Date("2016-07-22"))) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)

leaflet(df %>% filter(as.Date(disappear_time)>=as.Date("2016-07-23"))) %>%
  addTiles() %>%
  addCircleMarkers(~lng,
                   ~lat,
                   popup = ~paste(type_1, name),
                   color = ~color_1 ,
                   radius=2)

leaflet(pokestations) %>%
  addTiles() %>%
  #addMarkers(~lng,~lat,icon=icons(iconUrl = "http://cdm.numerico.mx/charts/pokedex/icons/Pstop.png"))
  addCircleMarkers(~lng,~lat,color= '#053E7D', fillColor= '#3177C5', fillOpacity= 0.5, radius=2)


map_data <- df %>% filter(type_1=="fire")

leafIcons <- icons(iconUrl = map_data$url_icon)

leaflet(map_data) %>% 
  addTiles() %>% 
  addMarkers(~lng,~lat, popup = ~paste(type_1, name), icon=icons(iconUrl = map_data$url_icon))

leaflet(gyms) %>%
  addTiles() %>%
  addMarkers(~lng,~lat,icon=icons(iconUrl = "http://cdm.numerico.mx/charts/pokedex/icons/Uncontested.png"))



############################ NIDOS ###################################
map_data <- df %>% filter(pokemon =="dratini")

leafIcons <- icons(iconUrl = map_data$url_icon)#, iconWidth = 70, iconHeight = 105)

density_loc <- kde2d(map_data$lng, map_data$lat, c(0.05,0.05), n=100)

loc_density_raster <- raster::raster(
  list(x = density_loc$x, y = density_loc$y, z = density_loc$z)
)

color_pal <- leaflet::colorNumeric(
  palette = c("#FFFFCC", "#41B6C4", "#0C2C84"),
  domain = raster::values(loc_density_raster), 
  na.color = "transparent"
)

leaflet(map_data) %>% 
  addTiles() %>% 
  #addCircleMarkers(~lng,~lat,radius=0.001, popup = ~paste(pokemon, disappear_time)) %>% 
  addMarkers(~lng,~lat, icon = leafIcons,  popup = ~paste(type_1, name)) %>%
  addRasterImage(x = loc_density_raster, opacity = 0.5 ,project = FALSE) %>% 
  addLegend(pal = color_pal, values = values(loc_density_raster))


################################### static ##################################

myMap <- get_map(location="Mexico City", crop=FALSE, zoom=11, maptype = "roadmap", source="osm")

map_data <- df %>% filter(pokemon=="sandshrew")

ggmap(myMap)+
  stat_density2d(
    aes(x = lng, y = lat, fill = ..level.., alpha=..level..), 
    data=map_data, geom="polygon", h=c(0.05,0.05))+
  geom_point(aes(x = lng, y = lat), data=map_data)+
  scale_fill_gradient(low="red", high="white", space="Lab")+
  theme_nothing()



############################## MAPAS MÁS RECIENTES ################################

gyms <- read_csv("gym.csv")

gyms <- gyms %>% filter(lat<20, lng > -99.5)

leaflet(gyms) %>%
  addTiles() %>%
  addMarkers(~lng,~lat, popup = ~paste('<a class="popUp" href="https://www.google.com/maps/dir/Current+Location/',lat,',',lng,'" target="_blank">Dime cómo llegar</a>'),icon=icons(iconUrl = "http://cdm.numerico.mx/charts/pokedex/icons/Uncontested.png"))

pokeStops <- read_csv("pok.csv")

pokeStops <- pokeStops %>% filter(lat<20, as.numeric(lat)>19.1 , lng > -99.5)

leaflet(pokeStops) %>%
  addTiles() %>%
  addCircleMarkers(~lng,~lat, 
                   popup = ~paste('<a class="popUp" href="https://www.google.com/maps/dir/Current+Location/',lat,',',lng,'" target="_blank">Dime cómo llegar</a>'),
                   color= '#03A9F4', 
                   fillColor= '#00BCD4', 
                   fillOpacity= 0.5, 
                   radius=2)

pokemon_sights <- read_csv("pokemon_sights.csv")

pokemon_sights$disappear_time <- as.POSIXct(pokemon_sights$disappear_time,origin = "1970-01-01", tz="GMT")

df <- pokemon_sights %>% 
  mutate(pokemon = str_to_lower(name)) %>% 
  left_join(pokemon_db, by = "pokemon")

df <- filter(df, lat<20, lng > -99.5)

leaflet(df) %>%
  addTiles() %>%
  addMarkers(~lng,~lat, popup = ~paste(type_1,name),icon=icons(iconUrl = df$url_icon))



########################## HISTOGRAMA RAREZA ##########################################

pokemon_db <- read_csv("pokemon_db.csv")

pokemon_sights <- read_csv("pokemon_sights.csv")

pokemon_sights$disappear_time <- as.POSIXct(pokemon_sights$disappear_time,origin = "1970-01-01", tz="GMT")

df <- pokemon_sights %>% 
  mutate(pokemon = str_to_lower(name)) %>% 
  left_join(pokemon_db, by = "pokemon")

pokemon_frequency <- df %>%
                      group_by(pokemon) %>% 
                      summarize(count_sights=n()) %>%
                      arrange(desc(count_sights)) %>% 
                      na.omit %>%
                      left_join(pokemon_db %>% subset(select=c(pokemon, url_icon)) , by="pokemon") %>%
                      mutate(pokemon=paste('<img src="',url_icon,'" ></img>          ',paste0(toupper(substr(pokemon, 1, 1)), substr(pokemon, 2, nchar(pokemon))))) %>%
                      mutate(count_sights=(5613/count_sights))

datatable(pokemon_frequency[,c(1,2)],
          rownames=FALSE,
          colnames = c('Pokemon','Número de Zubat por cada pokemon'),
          options = list(
            columnDefs = list(list(className = 'dt-center', targets = 0)),
            columnDefs = list(list(className = 'dt-right', targets = 1))
          ),
          escape=FALSE) %>% 
      formatRound(~count_sights, 0)

#Histograma frecuencias
ggplot(pokemon_frequency) +
  aes(x = pokemon, y = count_sights) +
  geom_bar(stat = "identity") +
  coord_flip()  


############################ Coordenadas para los nidos ##############################

pokemon_db <- read_csv("pokemon_db.csv")

pokemon_sights <- read_csv("pokemon_sights.csv")

pokemon_sights$disappear_time <- as.POSIXct(pokemon_sights$disappear_time,origin = "1970-01-01", tz="GMT")

df <- pokemon_sights %>% 
  mutate(pokemon = str_to_lower(name)) %>% 
  left_join(pokemon_db, by = "pokemon")

map_data <- df %>% filter(pokemon=="krabby")

leaflet(map_data) %>%
  addTiles() %>%
  addMarkers(~lng,~lat, popup = ~paste("Lat: ",lat,"  Long: ",lng),icon=icons(iconUrl = map_data$url_icon))

######################### MAPA CON LOS NIDOS POKEMON #################################

pokenests <- read_csv("pokeNest.csv")

pokenests <- pokenests %>%
  left_join(pokemon_db, by='pokemon')

leaflet(pokenests) %>%
  addTiles() %>%
  addMarkers(~lng,~lat,icon=icons(iconUrl=pokenests$url_icon),
             popup= ~paste('<p class="popUp">Nido de ',paste0(toupper(substr(pokemon, 1, 1)), substr(pokemon, 2, nchar(pokemon))),'<br>Tipo: ',paste0(toupper(substr(type_1, 1, 1)), substr(type_1, 2, nchar(type_1))),'<br><a href="https://www.google.com/maps/dir/Current+Location/',lat,',',lng,'" target="_blank">Dime cómo llegar</a></p>'))
