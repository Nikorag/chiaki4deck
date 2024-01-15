#set(CMAKE_INCLUDE_CURRENT_DIR ON)
#
#add_definitions(-DNAPI_VERSION=4)
#
## Build a shared library named after the project from the files in `src/`
#file(GLOB SOURCE_FILES "include/*.h" "src/*.cpp")
#add_library(web-chiaki SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
#
## Gives our library file a .node extension without any "lib" prefix
#set_target_properties(web-chiaki PROPERTIES PREFIX "" SUFFIX ".node")
#
## Essential include files to build a node addon,
## You should add this line in every CMake.js based project
#target_include_directories(web-chiaki PRIVATE ${CMAKE_JS_INC})
#
## Essential library files to link to a node addon
## You should add this line in every CMake.js based project
#target_link_libraries(web-chiaki ${CMAKE_JS_LIB})

cmake_minimum_required(VERSION 3.9)
cmake_policy(SET CMP0042 NEW)
set (CMAKE_CXX_STANDARD 11)

project (web-chiaki)
include_directories(${CMAKE_JS_INC})
file(GLOB SOURCE_FILES "include/*.h" "src/*.cpp")
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
target_link_libraries(${PROJECT_NAME} chiaki-lib)
target_include_directories(${PROJECT_NAME} PRIVATE "/Users/jamie/projects/Personal/web-chiaki/node_modules/node-addon-api")
target_include_directories(${PROJECT_NAME} PRIVATE "include")

# Define NAPI_VERSION
add_definitions(-DNAPI_VERSION=3)