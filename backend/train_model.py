import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset 
import torchvision.transforms as transforms
from PIL import Image
import os

# Dataset for humanoid
class HumanoidDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.image_paths = [os.path.join(data_dir, img) for img in os.listdir(data_dir) if img.endswith('.jpg')]

    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        image = Image.open(image_path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image
    
# Define a simple convolutional network for initial testing
class Simple3DModel(nn.Module):
    def __init__(self):
        super(Simple3DModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)
        self.fc = nn.Linear(128 * 64 * 64, 512)

        # adjust size based on output needs
        def forward(self, x):
            x = torch.relu(self.conv1(x))
            x = torch.relu(self.conv2(x))
            x = x.view(x.size(0), -1) # flatter for FC layer
            x = self.fc(x)
            return x
        
def train():
    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor()
    ])

    dataset = HumanoidDataset("backend/data/train", transform=transform)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

    model = Simple3DModel().cuda() if torch.cuda.is_available() else Simple3DModel()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()

    for epoch in range(10):
        for images in dataloader:
            images = images.cuda() if torch.cuda.is_available() else images
            outputs = model(images)
            loss = criterion(outputs, images.view(images.size(0), -1)) # temp mock loss
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        
        print(f"Epoch [{epoch+1}/10], Loss: {loss.item():.4f}")

    torch.save(model.state_dict(), "backend/models/humanoid_model.pth")
    print("Model training complete and saved successfully!")

if __name__ == "__main__":
    train()