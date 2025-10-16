sudo apt-get update

#Pangolin
sudo apt install -y cmake pkg-config libeigen3-dev libgl1-mesa-dev libglew-dev \
                 libwayland-dev libxkbcommon-dev wayland-protocols \
                 libegl1-mesa-dev libopengl-dev libglvnd-dev \
                 ffmpeg libavcodec-dev libavutil-dev libavformat-dev \
                 libswscale-dev libavdevice-dev libjpeg-dev libpng-dev \
                 libtiff5-dev libopenexr-dev build-essential libepoxy-dev \
                 python3-dev python3-numpy git libboost-all-dev libssl-dev
git clone https://github.com/stevenlovegrove/Pangolin.git
cd Pangolin
mkdir build && cd build
cmake ..
make -j$(nproc)
sudo make install
cd ~

#OpenCV

sudo apt install libopencv-dev

#eigen

sudo apt install libeigen3-dev

#build

mkdir build && cd build

cmake .. -DBUILD_PYTHON=ON -DPYTHON_EXECUTABLE=$(which python3) -DOpenCV_DIR=$(python3 -c "import cv2, os; print(os.path.dirname(cv2.__file__))")

make -j2

cd ../

pip install .